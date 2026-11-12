import { PROFILE } from "./config";
import { redis, withTimeout } from "./redis";

// ── 타입 ──────────────────────────────────────────────────────────────────────

export interface Lang {
  name: string;
  percent: number;
  color: string;
}

export interface RecentRepo {
  name: string;
  lang: string | null;
  color: string;
}

export interface GitHubStats {
  username: string;
  /** base64 data URI — 렌더링 시점에 네트워크 요청이 생기지 않도록 미리 인라인합니다. */
  avatar: string | null;
  totalContributions: number;
  lastYearContributions: number;
  streak: number;
  stars: number;
  prs: number;
  langs: Lang[];
  /** 최근에 푸시한 공개 레포 (최신순) */
  recentRepos: RecentRepo[];
  /** 주 단위 기여 강도. 각 문자열은 한 주, 각 문자는 하루의 레벨(0~4). 오래된 주가 먼저. */
  heat: string[];
}

export interface Visitors {
  today: number;
  total: number;
}

interface Snapshot {
  data: GitHubStats;
  fetchedAt: number;
}

export interface LoadedStats {
  data: GitHubStats;
  visitors: Visitors | null;
  /** 응답을 보낸 뒤 실행할 백그라운드 갱신 작업 (필요 없으면 null) */
  refresh: (() => Promise<void>) | null;
}

// ── 설정 ──────────────────────────────────────────────────────────────────────

const SNAPSHOT_KEY = "github:snapshot:v3";
const LOCK_KEY = "github:refresh-lock";
/** 이 시간이 지난 스냅샷은 응답 후 백그라운드에서 갱신합니다. */
const FRESH_MS = 30 * 60 * 1000;
const REDIS_TIMEOUT_MS = 1500;
/** 캐시가 전혀 없는 최초 요청에서만 GitHub 응답을 기다리는 한도 */
const COLD_FETCH_TIMEOUT_MS = 1500;
/** 백그라운드 갱신에서 GitHub GraphQL 응답을 기다리는 한도 (여러 해 집계라 수 초 걸립니다) */
const GITHUB_TIMEOUT_MS = 20_000;

/** 같은 서버 인스턴스 안에서 재사용하는 메모리 캐시 (Redis 장애 대비) */
let memory: Snapshot | null = null;
/** 진행 중인 갱신 — 같은 인스턴스에서 GitHub API를 중복 호출하지 않습니다. */
let inFlight: Promise<Snapshot> | null = null;

// ── GitHub GraphQL ───────────────────────────────────────────────────────────

function buildQuery(years: number[]): string {
  const yearly = years
    .map(
      (y) =>
        `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") { contributionCalendar { totalContributions } }`,
    )
    .join("\n      ");

  return `
  query($login: String!) {
    user(login: $login) {
      avatarUrl(size: 112)
      ${yearly}
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { contributionCount contributionLevel } }
        }
      }
      repositories(first: 100, ownerAffiliations: [OWNER], isFork: false, orderBy: { field: PUSHED_AT, direction: DESC }) {
        nodes {
          name
          isPrivate
          primaryLanguage { name color }
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
      pullRequests(states: [MERGED]) { totalCount }
    }
  }`;
}

const LEVEL: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

interface Day {
  contributionCount: number;
  contributionLevel: string;
}

/** 현재 연속 기여일. 오늘 아직 기여가 없으면 어제까지의 연속 기록을 유지합니다. */
function calcStreak(days: Day[]): number {
  let i = days.length - 1;
  if (i >= 0 && days[i].contributionCount === 0) i--;
  let streak = 0;
  for (; i >= 0 && days[i].contributionCount > 0; i--) streak++;
  return streak;
}

async function fetchAvatar(url: string | undefined, fallback: string | null): Promise<string | null> {
  if (!url) return fallback;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!res.ok) return fallback;
    const type = res.headers.get("content-type") ?? "image/png";
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return `data:${type};base64,${base64}`;
  } catch {
    return fallback;
  }
}

async function fetchFromGitHub(token: string, prevAvatar: string | null): Promise<GitHubStats> {
  const username = process.env.GITHUB_USERNAME ?? PROFILE.username;
  const thisYear = new Date().getUTCFullYear();
  const years: number[] = [];
  for (let y = PROFILE.sinceYear; y <= thisYear; y++) years.push(y);

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: buildQuery(years), variables: { login: username } }),
    cache: "no-store",
    signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);

  const json = await res.json();
  if (json.errors || !json.data?.user) {
    throw new Error(`GitHub GraphQL error: ${JSON.stringify(json.errors ?? "user not found")}`);
  }
  const u = json.data.user;

  const totalContributions = years.reduce(
    (sum, y) => sum + (u[`y${y}`]?.contributionCalendar?.totalContributions ?? 0),
    0,
  );

  const calendar = u.contributionsCollection.contributionCalendar;
  const weeks: { contributionDays: Day[] }[] = calendar.weeks;
  const heat = weeks.map((w) =>
    w.contributionDays.map((d) => LEVEL[d.contributionLevel] ?? 0).join(""),
  );
  const streak = calcStreak(weeks.flatMap((w) => w.contributionDays));

  type Repo = {
    name: string;
    isPrivate: boolean;
    primaryLanguage: { name: string; color: string | null } | null;
    stargazerCount: number;
    languages: { edges: { size: number; node: { name: string; color: string | null } }[] };
  };
  const repos: Repo[] = u.repositories.nodes;
  const stars = repos.reduce((acc, r) => acc + r.stargazerCount, 0);

  const sizes = new Map<string, { size: number; color: string }>();
  for (const repo of repos) {
    for (const { size, node } of repo.languages.edges) {
      const entry = sizes.get(node.name) ?? { size: 0, color: node.color ?? "#888888" };
      entry.size += size;
      sizes.set(node.name, entry);
    }
  }
  const totalSize = [...sizes.values()].reduce((a, b) => a + b.size, 0) || 1;
  const langs: Lang[] = [...sizes.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 5)
    .map(([name, { size, color }]) => ({
      name,
      percent: Math.round((size / totalSize) * 1000) / 10,
      color,
    }));

  // 비공개 레포 이름은 카드에 노출하지 않습니다. (쿼리가 이미 최근 푸시순으로 정렬)
  const recentRepos: RecentRepo[] = repos
    .filter((r) => !r.isPrivate)
    .slice(0, 3)
    .map((r) => ({
      name: r.name,
      lang: r.primaryLanguage?.name ?? null,
      color: r.primaryLanguage?.color ?? "#888888",
    }));

  return {
    username,
    avatar: await fetchAvatar(u.avatarUrl, prevAvatar),
    totalContributions,
    lastYearContributions: calendar.totalContributions,
    streak,
    stars,
    prs: u.pullRequests.totalCount,
    langs,
    recentRepos,
    heat,
  };
}

// ── 스냅샷 캐시 ───────────────────────────────────────────────────────────────

function refreshSnapshot(token: string, prev: Snapshot | null): Promise<Snapshot> {
  inFlight ??= (async () => {
    const startedAt = Date.now();
    const data = await fetchFromGitHub(token, prev?.data.avatar ?? null);
    const snapshot: Snapshot = { data, fetchedAt: Date.now() };
    console.log(`[github] snapshot refreshed in ${snapshot.fetchedAt - startedAt}ms`);
    memory = snapshot;
    // TTL 없이 저장 — GitHub API가 죽어도 마지막 성공 데이터를 계속 보여줍니다.
    if (redis) await redis.set(SNAPSHOT_KEY, snapshot);
    return snapshot;
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** 여러 요청이 동시에 갱신하지 않도록 Redis 락을 잡고 갱신합니다. */
async function backgroundRefresh(token: string, prev: Snapshot | null): Promise<void> {
  try {
    if (redis) {
      const locked = await redis.set(LOCK_KEY, "1", { nx: true, ex: 60 });
      if (!locked) return;
    }
    await refreshSnapshot(token, prev);
  } catch (err) {
    console.error("[github] background refresh failed:", err);
  }
}

/** 방문자 카운트 증가 + 스냅샷 조회를 한 번의 왕복으로 처리합니다. */
async function readRedis(): Promise<{ visitors: Visitors; snapshot: Snapshot | null } | null> {
  if (!redis) return null;
  // 한국 시간 기준으로 '오늘'을 나눕니다.
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dayKey = `visits:${today}`;

  const pipeline = redis.pipeline();
  pipeline.incr("visits:total");
  pipeline.incr(dayKey);
  pipeline.expire(dayKey, 60 * 60 * 24 * 3);
  pipeline.get<Snapshot>(SNAPSHOT_KEY);

  const [total, todayCount, , snapshot] = await withTimeout(
    pipeline.exec<[number, number, number, Snapshot | null]>(),
    REDIS_TIMEOUT_MS,
    "redis",
  );
  return { visitors: { today: todayCount, total }, snapshot: snapshot?.data ? snapshot : null };
}

// ── 진입점 ────────────────────────────────────────────────────────────────────

/**
 * 카드에 필요한 데이터를 최대한 빨리 돌려줍니다.
 *
 * GitHub의 이미지 프록시(camo)는 응답이 몇 초만 늦어도 엑박을 띄우기 때문에,
 * 요청 경로에서는 캐시된 스냅샷만 읽고 GitHub API 호출은 응답 이후(`refresh`)로 미룹니다.
 */
export async function loadStats(): Promise<LoadedStats> {
  const token = process.env.GITHUB_TOKEN;

  const fromRedis = await readRedis().catch((err) => {
    console.error("[redis]", err);
    return null;
  });
  const visitors = fromRedis?.visitors ?? null;

  const candidates = [fromRedis?.snapshot, memory].filter((s): s is Snapshot => !!s);
  const snapshot = candidates.sort((a, b) => b.fetchedAt - a.fetchedAt)[0] ?? null;
  if (snapshot) memory = snapshot;

  if (!token) {
    console.warn("[github] GITHUB_TOKEN is not set — serving cached or mock data");
    return { data: snapshot?.data ?? MOCK_DATA, visitors, refresh: null };
  }

  if (snapshot) {
    const stale = Date.now() - snapshot.fetchedAt > FRESH_MS;
    return {
      data: snapshot.data,
      visitors,
      refresh: stale ? () => backgroundRefresh(token, snapshot) : null,
    };
  }

  // 캐시가 전혀 없는 최초 요청: 잠깐만 기다리고, 늦으면 빈 카드로 응답한 뒤 계속 채웁니다.
  const pending = refreshSnapshot(token, null);
  try {
    const fresh = await withTimeout(pending, COLD_FETCH_TIMEOUT_MS, "github");
    return { data: fresh.data, visitors, refresh: null };
  } catch (err) {
    console.error("[github] cold fetch failed:", err);
    return {
      data: EMPTY_DATA,
      visitors,
      refresh: () => pending.then(() => undefined, () => undefined),
    };
  }
}

// ── Fallback 데이터 ───────────────────────────────────────────────────────────

/** 아직 한 번도 데이터를 가져오지 못했을 때 */
export const EMPTY_DATA: GitHubStats = {
  username: process.env.GITHUB_USERNAME ?? PROFILE.username,
  avatar: null,
  totalContributions: 0,
  lastYearContributions: 0,
  streak: 0,
  stars: 0,
  prs: 0,
  langs: [],
  recentRepos: [],
  heat: [],
};

/** GITHUB_TOKEN 없이 로컬에서 디자인을 확인할 때 쓰는 샘플 */
export const MOCK_DATA: GitHubStats = {
  username: PROFILE.username,
  avatar: null,
  totalContributions: 2048,
  lastYearContributions: 742,
  streak: 47,
  stars: 312,
  prs: 89,
  langs: [
    { name: "TypeScript", percent: 52.3, color: "#3178C6" },
    { name: "Python", percent: 23.8, color: "#3572A5" },
    { name: "Rust", percent: 11.9, color: "#DEA584" },
    { name: "Go", percent: 8.1, color: "#00ADD8" },
    { name: "MDX", percent: 3.9, color: "#FCB32C" },
  ],
  recentRepos: [
    { name: "github-molt-stats", lang: "TypeScript", color: "#3178C6" },
    { name: "ai-chat-app", lang: "Python", color: "#3572A5" },
    { name: "tauri-desktop-tool", lang: "Rust", color: "#DEA584" },
  ],
  heat: Array.from({ length: 53 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const n = (w * 37 + d * 101 + ((w * d) % 5) * 13) % 11;
      return n < 4 ? 0 : n < 7 ? 1 : n < 9 ? 2 : n < 10 ? 3 : 4;
    }).join(""),
  ),
};

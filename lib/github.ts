import { redis } from "./redis";

// ── 타입 ──────────────────────────────────────────────────────────────────────

export interface Lang {
  name: string;
  percent: number;
  color: string;
  end: string;
}

export interface RecentRepo {
  name: string;
  lang: string;
  langColor: string;
  stars: number;
}

export interface GitHubData {
  username:     string;
  avatarUrl:    string;
  commits:      number;
  streak:       number;
  stars:        number;
  prs:          number;
  langs:        Lang[];
  recentRepos:  RecentRepo[];
  visitorToday: number;
  visitorTotal: number;
}

// ── GraphQL 쿼리 ──────────────────────────────────────────────────────────────

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      avatarUrl
      c2016: contributionsCollection(from: "2016-01-01T00:00:00Z", to: "2016-12-31T23:59:59Z") { contributionCalendar { totalContributions } }
      c2017: contributionsCollection(from: "2017-01-01T00:00:00Z", to: "2017-12-31T23:59:59Z") { contributionCalendar { totalContributions } }
      c2018: contributionsCollection(from: "2018-01-01T00:00:00Z", to: "2018-12-31T23:59:59Z") { contributionCalendar { totalContributions } }
      c2019: contributionsCollection(from: "2019-01-01T00:00:00Z", to: "2019-12-31T23:59:59Z") { contributionCalendar { totalContributions } }
      c2020: contributionsCollection(from: "2020-01-01T00:00:00Z", to: "2020-12-31T23:59:59Z") { contributionCalendar { totalContributions } }
      c2021: contributionsCollection(from: "2021-01-01T00:00:00Z", to: "2021-12-31T23:59:59Z") { contributionCalendar { totalContributions } }
      c2022: contributionsCollection(from: "2022-01-01T00:00:00Z", to: "2022-12-31T23:59:59Z") { contributionCalendar { totalContributions } }
      c2023: contributionsCollection(from: "2023-01-01T00:00:00Z", to: "2023-12-31T23:59:59Z") { contributionCalendar { totalContributions } }
      c2024: contributionsCollection(from: "2024-01-01T00:00:00Z", to: "2024-12-31T23:59:59Z") { contributionCalendar { totalContributions } }
      c2025: contributionsCollection(from: "2025-01-01T00:00:00Z", to: "2025-12-31T23:59:59Z") { contributionCalendar { totalContributions } }
      c2026: contributionsCollection(from: "2026-01-01T00:00:00Z", to: "2026-12-31T23:59:59Z") { contributionCalendar { totalContributions } }
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
            }
          }
        }
      }
      repositories(
        first: 80
        ownerAffiliations: [OWNER]
        isFork: false
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        nodes {
          name
          stargazerCount
          primaryLanguage { name color }
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
      pullRequests(states: [MERGED]) { totalCount }
    }
  }
`;

// ── Gradient end 색상 매핑 ────────────────────────────────────────────────────

const GRAD_MAP: Record<string, string> = {
  TypeScript:  "#38bdf8",
  JavaScript:  "#facc15",
  Python:      "#a78bfa",
  Rust:        "#fb923c",
  Go:          "#34d399",
  CSS:         "#f472b6",
  HTML:        "#f97316",
  MDX:         "#94a3b8",
  Vue:         "#4ade80",
  Swift:       "#f87171",
};

function gradEnd(name: string, baseColor: string): string {
  return GRAD_MAP[name] ?? baseColor;
}

// ── 스트릭 계산 ───────────────────────────────────────────────────────────────

function calcStreak(weeks: { contributionDays: { contributionCount: number }[] }[]): number {
  const days = weeks.flatMap((w) => w.contributionDays).reverse();
  let streak = 0;
  for (const d of days) {
    if (d.contributionCount > 0) streak++;
    else if (streak === 0) continue;
    else break;
  }
  return streak;
}

// ── Redis 캐시 로드 ───────────────────────────────────────────────────────────

async function loadCachedData(): Promise<Omit<GitHubData, "visitorToday" | "visitorTotal"> | null> {
  try {
    const cached = await redis.get<Omit<GitHubData, "visitorToday" | "visitorTotal">>("github:data");
    return cached ?? null;
  } catch {
    return null;
  }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchGitHubData(visitorToday: number, visitorTotal: number): Promise<GitHubData> {
  const GH_TOKEN    = process.env.GITHUB_TOKEN;
  const GH_USERNAME = process.env.GITHUB_USERNAME ?? "JJleem";

  if (!GH_TOKEN) {
    console.warn("[github] No GITHUB_TOKEN — trying Redis cache");
    const cached = await loadCachedData();
    return cached
      ? { ...cached, visitorToday, visitorTotal }
      : { ...MOCK_DATA, visitorToday, visitorTotal };
  }

  const res = await fetch("https://api.github.com/graphql", {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${GH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: GH_USERNAME } }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error("[github] API error:", res.status);
    const cached = await loadCachedData();
    return cached
      ? { ...cached, visitorToday, visitorTotal }
      : { ...MOCK_DATA, visitorToday, visitorTotal };
  }

  const json = await res.json();
  if (json.errors) {
    console.error("[github] GraphQL errors:", json.errors);
    const cached = await loadCachedData();
    return cached
      ? { ...cached, visitorToday, visitorTotal }
      : { ...MOCK_DATA, visitorToday, visitorTotal };
  }

  const u = json.data.user;

  const commits: number = [
    "c2016","c2017","c2018","c2019","c2020",
    "c2021","c2022","c2023","c2024","c2025","c2026",
  ].reduce((sum, key) => sum + (u[key]?.contributionCalendar?.totalContributions ?? 0), 0);

  const streak = calcStreak(u.contributionsCollection.contributionCalendar.weeks);

  const stars: number = u.repositories.nodes.reduce(
    (acc: number, r: { stargazerCount: number }) => acc + r.stargazerCount,
    0
  );

  const prs: number = u.pullRequests.totalCount;

  const sizeMap: Record<string, { size: number; color: string }> = {};
  for (const repo of u.repositories.nodes) {
    for (const edge of repo.languages.edges) {
      const name: string  = edge.node.name;
      const color: string = edge.node.color ?? "#888";
      if (!sizeMap[name]) sizeMap[name] = { size: 0, color };
      sizeMap[name].size += edge.size as number;
    }
  }
  const totalSize = Object.values(sizeMap).reduce((a, b) => a + b.size, 0);
  const langs: Lang[] = Object.entries(sizeMap)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 5)
    .map(([name, { size, color }]) => ({
      name,
      percent: Math.round((size / totalSize) * 100),
      color,
      end: gradEnd(name, color),
    }));

  const recentRepos: RecentRepo[] = u.repositories.nodes
    .slice(0, 4)
    .map((r: { name: string; primaryLanguage?: { name: string; color: string }; stargazerCount: number }) => ({
      name:      r.name,
      lang:      r.primaryLanguage?.name  ?? "—",
      langColor: r.primaryLanguage?.color ?? "#666",
      stars:     r.stargazerCount,
    }));

  const avatarUrl: string = u.avatarUrl ?? `https://github.com/${GH_USERNAME}.png`;

  const coreData = { username: GH_USERNAME, avatarUrl, commits, streak, stars, prs, langs, recentRepos };

  // 성공 시 Redis에 저장 (7일 TTL)
  redis.set("github:data", JSON.stringify(coreData), { ex: 60 * 60 * 24 * 7 }).catch(() => {});

  return { ...coreData, visitorToday, visitorTotal };
}

// ── Mock fallback ─────────────────────────────────────────────────────────────

export const MOCK_DATA = {
  username:  "JJleem",
  avatarUrl: "https://github.com/JJleem.png",
  commits:   2048,
  streak:    47,
  stars:     312,
  prs:       89,
  langs: [
    { name: "TypeScript", percent: 52, color: "#3178C6", end: "#38bdf8" },
    { name: "Python",     percent: 24, color: "#4B8BBE", end: "#a78bfa" },
    { name: "Rust",       percent: 12, color: "#CE422B", end: "#fb923c" },
    { name: "Go",         percent:  8, color: "#00ACD7", end: "#34d399" },
    { name: "MDX",        percent:  4, color: "#475569", end: "#94a3b8" },
  ],
  recentRepos: [
    { name: "github-molt-stats",  lang: "TypeScript", langColor: "#3178C6", stars: 12 },
    { name: "ai-chat-app",        lang: "Python",     langColor: "#4B8BBE", stars: 8  },
    { name: "tauri-desktop-tool", lang: "Rust",       langColor: "#CE422B", stars: 24 },
    { name: "nextjs-portfolio",   lang: "TypeScript", langColor: "#3178C6", stars: 15 },
  ],
};

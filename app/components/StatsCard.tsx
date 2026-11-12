/**
 * StatsCard v4 — bento 레이아웃, 라이트/다크 테마
 *
 * Satori로 렌더링되므로 flexbox만 사용하고, 자식이 여럿인 요소는 display:flex가 필요합니다.
 */

import type { CSSProperties, ReactNode } from "react";
import type { GitHubStats, Visitors } from "@/lib/github";
import { PROFILE } from "@/lib/config";

export const CARD_WIDTH = 900;
export const CARD_HEIGHT = 520;

export type ThemeName = "dark" | "light";

export interface StatsCardProps {
  data: GitHubStats;
  visitors: Visitors | null;
  theme: ThemeName;
}

// ── 테마 ──────────────────────────────────────────────────────────────────────

export interface Theme {
  page: string;
  /** 칸 배경. 뒤의 픽셀 물결이 은은하게 비치도록 반투명입니다. */
  cell: string;
  border: string;
  t1: string;
  t2: string;
  t3: string;
  accent: string;
  /** 히트맵 레벨 0~4 */
  heat: [string, string, string, string, string];
  track: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  dark: {
    page: "#09090B",
    cell: "rgba(18,18,21,0.6)",
    border: "rgba(255,255,255,0.08)",
    t1: "#FAFAFA",
    t2: "#A1A1AA",
    t3: "#71717A",
    accent: "#6CABDD",
    heat: [
      "rgba(255,255,255,0.06)",
      "rgba(108,171,221,0.30)",
      "rgba(108,171,221,0.52)",
      "rgba(108,171,221,0.76)",
      "#6CABDD",
    ],
    track: "rgba(255,255,255,0.06)",
  },
  light: {
    page: "#FFFFFF",
    cell: "rgba(247,247,248,0.62)",
    border: "rgba(9,9,11,0.09)",
    t1: "#09090B",
    t2: "#52525B",
    t3: "#8A8A93",
    accent: "#2477BF",
    heat: [
      "rgba(9,9,11,0.06)",
      "rgba(36,119,191,0.28)",
      "rgba(36,119,191,0.50)",
      "rgba(36,119,191,0.75)",
      "#2477BF",
    ],
    track: "rgba(9,9,11,0.06)",
  },
};

const SANS = "Geist";
const MONO = "Geist Mono";
export const PAD = 20;
export const GAP = 12;
export const CELL_PAD = 22;
export const SIDE_WIDTH = 300;
export const TOP_ROW_HEIGHT = 216;
export const HEAT_WEEKS = 38;
/** 기여 셀 안쪽 폭: 카드 폭 - 좌우 여백 - 프로필 셀 - 간격 - 셀 패딩 - 테두리(카드·셀) */
export const HEAT_WIDTH = CARD_WIDTH - PAD * 2 - SIDE_WIDTH - GAP - CELL_PAD * 2 - 4;
export const HEAT_HEIGHT = 88;

const num = (n: number) => n.toLocaleString("en-US");

// ── 조각들 ────────────────────────────────────────────────────────────────────

function Cell({ t, style, children }: { t: Theme; style?: CSSProperties; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: t.cell,
        border: `1px solid ${t.border}`,
        borderRadius: 16,
        padding: CELL_PAD,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Label({ t, children }: { t: Theme; children: ReactNode }) {
  return (
    <span
      style={{
        display: "flex",
        fontFamily: MONO,
        fontSize: 10.5,
        fontWeight: 500,
        letterSpacing: 1.2,
        color: t.t3,
      }}
    >
      {children}
    </span>
  );
}

function Avatar({ t, src }: { t: Theme; src: string | null }) {
  const size = 52;
  if (!src) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: size / 2,
          background: t.accent,
          color: t.page,
          fontSize: 24,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {PROFILE.displayName.slice(0, 1)}
      </div>
    );
  }
  return (
    <img
      src={src}
      width={size}
      height={size}
      style={{ borderRadius: size / 2, flexShrink: 0 }}
    />
  );
}

function Profile({ t, data }: { t: Theme; data: GitHubStats }) {
  return (
    <Cell t={t} style={{ width: SIDE_WIDTH, flexShrink: 0, justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar t={t} src={data.avatar} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ display: "flex", fontSize: 22, fontWeight: 600, color: t.t1, letterSpacing: -0.6, lineHeight: 1 }}>
            {PROFILE.displayName}
          </span>
          <span style={{ display: "flex", fontFamily: MONO, fontSize: 12, color: t.t3, lineHeight: 1 }}>
            @{data.username}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ display: "flex", fontSize: 14, fontWeight: 500, color: t.accent }}>{PROFILE.role}</span>
        <span style={{ display: "flex", fontSize: 12.5, color: t.t2, lineHeight: 1.45 }}>{PROFILE.slogan}</span>
      </div>

    </Cell>
  );
}

function Contributions({ t, data }: { t: Theme; data: GitHubStats }) {
  return (
    <Cell t={t} style={{ flex: 1, justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Label t={t}>TOTAL CONTRIBUTIONS</Label>
          <span style={{ display: "flex", fontSize: 54, fontWeight: 600, color: t.t1, letterSpacing: -2.4, lineHeight: 1 }}>
            {num(data.totalContributions)}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <Label t={t}>LAST 12 MONTHS</Label>
          <span style={{ display: "flex", fontSize: 22, fontWeight: 600, color: t.accent, letterSpacing: -0.6, lineHeight: 1 }}>
            {num(data.lastYearContributions)}
          </span>
        </div>
      </div>
      {/* 히트맵 자리 — 애니메이션이 필요해서 Satori 밖(app/components/overlay.ts)에서 그립니다. */}
      <div style={{ display: "flex", height: HEAT_HEIGHT }} />
    </Cell>
  );
}

function Stat({ t, label, value, unit }: { t: Theme; label: string; value: string; unit?: string }) {
  return (
    <Cell t={t} style={{ flex: 1, padding: "16px 20px", justifyContent: "space-between" }}>
      <Label t={t}>{label}</Label>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ display: "flex", fontSize: 28, fontWeight: 600, color: t.t1, letterSpacing: -1, lineHeight: 1 }}>
          {value}
        </span>
        {unit ? (
          <span style={{ display: "flex", fontSize: 12, color: t.t3, lineHeight: 1 }}>{unit}</span>
        ) : null}
      </div>
    </Cell>
  );
}

function Languages({ t, data }: { t: Theme; data: GitHubStats }) {
  return (
    <Cell t={t} style={{ flex: 1, justifyContent: "space-between" }}>
      <Label t={t}>TOP LANGUAGES</Label>
      <div style={{ display: "flex", gap: 3, height: 12 }}>
        {data.langs.length === 0 ? (
          <div style={{ display: "flex", flex: 1, borderRadius: 4, background: t.track }} />
        ) : (
          data.langs.map((lang) => (
            <div
              key={lang.name}
              style={{ display: "flex", flexGrow: Math.max(lang.percent, 1.5), flexBasis: 0, borderRadius: 4, background: lang.color }}
            />
          ))
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", columnGap: 14, rowGap: 10 }}>
        {data.langs.map((lang) => (
          <div key={lang.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", width: 8, height: 8, borderRadius: 4, background: lang.color }} />
            <span style={{ display: "flex", fontSize: 12, fontWeight: 500, color: t.t1, lineHeight: 1 }}>{lang.name}</span>
            <span style={{ display: "flex", fontFamily: MONO, fontSize: 11, color: t.t3, lineHeight: 1 }}>
              {lang.percent < 1 ? "<1" : Math.round(lang.percent)}%
            </span>
          </div>
        ))}
      </div>
    </Cell>
  );
}

function RecentRepos({ t, data }: { t: Theme; data: GitHubStats }) {
  const clip = (name: string) => (name.length > 24 ? `${name.slice(0, 23)}…` : name);
  return (
    <Cell t={t} style={{ width: SIDE_WIDTH, flexShrink: 0, justifyContent: "space-between" }}>
      <Label t={t}>RECENTLY ACTIVE</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {data.recentRepos.map((repo) => (
          <div key={repo.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", width: 8, height: 8, borderRadius: 4, background: repo.color }} />
              <span style={{ display: "flex", fontSize: 12.5, fontWeight: 500, color: t.t1, lineHeight: 1 }}>
                {clip(repo.name)}
              </span>
            </div>
            {repo.lang ? (
              <span style={{ display: "flex", fontFamily: MONO, fontSize: 11, color: t.t3, lineHeight: 1 }}>
                {repo.lang}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </Cell>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────

export default function StatsCard({ data, visitors, theme }: StatsCardProps) {
  const t = THEMES[theme];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        padding: PAD,
        gap: GAP,
        // 카드 배경·테두리는 overlay.ts에서 그립니다 (픽셀 물결을 칸들 뒤에 깔기 위해).
        // 투명 테두리는 안쪽 좌표를 유지하기 위한 자리입니다.
        border: "1px solid transparent",
        fontFamily: SANS,
        color: t.t1,
      }}
    >
      <div style={{ display: "flex", gap: GAP, height: TOP_ROW_HEIGHT }}>
        <Profile t={t} data={data} />
        <Contributions t={t} data={data} />
      </div>

      <div style={{ display: "flex", gap: GAP, height: 88 }}>
        <Stat t={t} label="CURRENT STREAK" value={num(data.streak)} unit={data.streak === 1 ? "day" : "days"} />
        <Stat t={t} label="STARS EARNED" value={num(data.stars)} />
        <Stat t={t} label="MERGED PRS" value={num(data.prs)} />
        <Stat
          t={t}
          label="VISITORS TODAY"
          value={visitors ? num(visitors.today) : "—"}
          unit={visitors ? `/ ${num(visitors.total)} total` : undefined}
        />
      </div>

      <div style={{ display: "flex", gap: GAP, flex: 1 }}>
        <Languages t={t} data={data} />
        <RecentRepos t={t} data={data} />
      </div>
    </div>
  );
}

/**
 * StatsCard v3.2 — Premium, Witty & Philosophy
 *
 * 고급스러운 딥 슬레이트(Deep Slate) 배경 + 스카이블루 포인트
 * 하단에 개인 슬로건 추가로 브랜딩 강화
 */

import type { GitHubData } from "@/lib/github";
export type { GitHubData as StatsCardProps };

// ── 플랫폼 아이콘 (Inline SVG 컴포넌트) ──────────────────────────────────────
function GithubIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#94A3B8" width="15" height="15" style={{ display: "flex" }}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}

function VelogIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="15" height="15" style={{ display: "flex", borderRadius: "3px" }}>
      <rect width="36" height="36" rx="8" fill="#20c997"/>
      <path fill="white" d="M9 10h5l4 11 4-11h5L18 26z"/>
    </svg>
  );
}

// ── 프리미엄 컬러 팔레트 ────────────────────────────────────────────────────
const BG     = "#0F111A"; 
const BORDER = "rgba(255,255,255,0.06)";
const T1     = "#F8FAFC"; 
const T2     = "#94A3B8";
const T3     = "#64748B";

const HERO_COLOR = "#6CABDD"; 

const BADGE_ROWS = [
  ["Next.js", "React", "TypeScript"],
  ["FastAPI", "Claude API"],
  ["Python", "Rust", "Tauri"],
];

// ── 서포팅 스탯 ─────────────────────────────────────────────────────────────
function Stat({ val, label, color }: { val: string; label: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{
        fontSize: 26, fontWeight: 800,
        color, lineHeight: 1, letterSpacing: "-0.5px",
      }}>
        {val}
      </span>
      <span style={{ fontSize: 10, color: T3, letterSpacing: 2, fontWeight: 600 }}>
        {label}
      </span>
    </div>
  );
}

// ── 언어 바 ───────────────────────────────────────────────────────────────────
function LangRow({
  lang, idx,
}: {
  lang: { name: string; percent: number; color: string; end: string };
  idx: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: lang.color, flexShrink: 0, display: "flex",
        boxShadow: `0 0 6px ${lang.color}40`, 
      }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: T1, width: 84, flexShrink: 0 }}>{lang.name}</span>
      <div style={{
        flex: 1, height: 6,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 99, display: "flex", overflow: "hidden",
      }}>
        <div
          style={{
            height: "100%", width: `${lang.percent}%`,
            background: `linear-gradient(90deg, ${lang.color}, ${lang.end})`,
            borderRadius: 99, display: "flex",
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: T2, width: 34, flexShrink: 0, textAlign: "right" }}>
        {lang.percent}%
      </span>
    </div>
  );
}

// ── 뱃지 ────────────────────────────────────────────────────────────
function Badge({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex", padding: "6px 14px",
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${BORDER}`,
      borderRadius: 8, 
      fontSize: 11, fontWeight: 500, color: T2,
    }}>
      {label}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function StatsCard(p: GitHubData) {
  const { username, avatarUrl, commits, streak, stars, prs, langs } = p;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      width: 900, height: 560,
      background: BG,
      border: `1px solid ${BORDER}`,
      borderRadius: 24, 
      overflow: "hidden",
      boxShadow: "0 20px 40px rgba(0,0,0,0.2)", 
    }}>

      {/* ── 상단: 프로필 + 스탯 계층 ────────────────────────────────────────── */}
      <div style={{
        display: "flex", flexDirection: "row",
        flex: 1,
        padding: "44px 52px 36px",
        gap: 52,
      }}>

        {/* 프로필 */}
        <div style={{
          display: "flex", flexDirection: "column",
          width: 200, flexShrink: 0,
        }}>
          {/* 아바타 (두께감 + 고대비 그라데이션 + 글로우 효과) */}
          <div style={{
            width: 92, height: 92, borderRadius: "50%",
            background: "linear-gradient(135deg, #00F2FE 0%, #4FACFE 50%, #6366F1 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20, flexShrink: 0,
            boxShadow: "0 0 16px rgba(79, 172, 254, 0.4)", 
          }}>
            <img
              src={avatarUrl}
              width={78} height={78} 
              style={{ 
                borderRadius: "50%", 
                display: "flex", 
                border: `3px solid ${BG}` 
              }}
            />
          </div>

          <span style={{
            fontSize: 24, fontWeight: 800, color: T1,
            lineHeight: 1, marginBottom: 8, display: "flex", letterSpacing: "-0.5px",
            alignItems:"center", gap: 8
          }}>
            Molt<span style={{ fontSize: 13, fontWeight: 500, color: HERO_COLOR, display: "flex" }}>
           {username} 
          </span>
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: HERO_COLOR, marginBottom: 24, display: "flex" }}>
            AI Application Engineer
          </span>

         <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { Icon: GithubIcon, label: "github.com/JJleem" },
              { Icon: VelogIcon,  label: "velog.io/@jjleem"  },
            ].map(({ Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon /> 
                <span style={{ fontSize: 12, fontWeight: 500, color: T3, display: "flex" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 스탯: 위계 구조 ─────────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          justifyContent: "center",
          gap: 24,
        }}>

          {/* Hero — commits */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{
              fontSize: 64, fontWeight: 800,
              color: T1, lineHeight: 1, letterSpacing: "-1.5px"
            }}>
              {commits.toLocaleString()}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: HERO_COLOR, letterSpacing: 3 }}>
              TOTAL CONTRIBUTIONS
            </span>
          </div>

          {/* 가로선 */}
          <div style={{ height: 1, background: BORDER, display: "flex" }} />

          {/* Supporting — streak / stars / prs */}
          <div style={{ display: "flex", gap: 48 }}>
            <Stat val={`${streak}d`}    label="STREAK"        color="#F472B6" />
            <Stat val={String(stars)}   label="STARS"         color="#FBBF24" />
            <Stat val={String(prs)}     label="PULL REQUESTS" color="#34D399" />
          </div>

        </div>

      </div>

      {/* ── 가로 구분선 ─────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: BORDER, margin: "0 52px", display: "flex" }} />

    {/* ── 하단: 언어 | 스택 | 슬로건 ────────────────────────────────────── */}
      <div style={{
        display: "flex", flexDirection: "row",
        padding: "24px 52px 28px",
        flex: 1, // 남은 세로 공간을 확실하게 차지하도록 설정
      }}>

        {/* 언어 바 + 슬로건 (Left) */}
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between", // 💡 flex: 1 래퍼를 지우고 양끝 정렬로 겹침 방지
          paddingRight: 32,
        }}>
          {/* 언어 리스트 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {langs.slice(0, 4).map((l, i) => (
              <LangRow key={l.name} lang={l} idx={i} />
            ))}
          </div>
          {/* 맨 밑: 슬로건 (marginTop 제거) */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: HERO_COLOR, fontSize: 14, fontWeight: 700, marginRight: 6, display: "flex" }}>"</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: T2, letterSpacing: 1, display: "flex" }}>
              AI empowers humans beyond their limits.
            </span>
            <span style={{ color: HERO_COLOR, fontSize: 14, fontWeight: 700, marginLeft: 6, display: "flex" }}>"</span>
          </div>
        </div>

        {/* 세로 구분선 */}
        <div style={{ width: 1, background: BORDER, display: "flex", alignSelf: "stretch" }} />

        {/* 스택 뱃지 + 서명 (Right) */}
        <div style={{
          width: 320, flexShrink: 0,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between", // 💡 여기도 양끝 정렬
          paddingLeft: 32,
        }}>
          {/* 뱃지 리스트 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {BADGE_ROWS.map((row, ri) => (
              <div key={ri} style={{ display: "flex", gap: 8 }}>
                {row.map((s) => <Badge key={s} label={s} />)}
              </div>
            ))}
          </div>
          {/* 맨 밑: 서명 (marginTop 제거) */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: T3,
              letterSpacing: 2, display: "flex",
            }}>
              CRAFTED BY MOLT
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
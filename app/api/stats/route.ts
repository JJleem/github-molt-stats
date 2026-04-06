import satori from "satori";
import { createElement } from "react";
import { readFileSync } from "fs";
import { join } from "path";
import StatsCard from "@/app/components/StatsCard";
import { fetchGitHubData } from "@/lib/github";

const W = 900;
const H = 560;

let _r: ArrayBuffer | null = null;
let _b: ArrayBuffer | null = null;

function loadFont(f: string): ArrayBuffer {
  const buf = readFileSync(
    join(process.cwd(), "node_modules/@fontsource/jetbrains-mono/files", f)
  );
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

function getFonts() {
  if (!_r) _r = loadFont("jetbrains-mono-latin-400-normal.woff");
  if (!_b) _b = loadFont("jetbrains-mono-latin-700-normal.woff");
  return { r: _r, b: _b };
}

// StatsCard 자체가 background + borderRadius를 처리하므로 SVG 주입 불필요
const INJECTED = ``;

// ── 애니메이션 CSS ─────────────────────────────────────────────────────────────
const CSS = `
  /* 언어 바 */
  @keyframes fillBar {
    from { transform: scaleX(0); transform-origin: left center; }
    to   { transform: scaleX(1); transform-origin: left center; }
  }
  .bar-0 { animation: fillBar 0.7s cubic-bezier(0.22,1,0.36,1) 0.00s both; }
  .bar-1 { animation: fillBar 0.7s cubic-bezier(0.22,1,0.36,1) 0.14s both; }
  .bar-2 { animation: fillBar 0.7s cubic-bezier(0.22,1,0.36,1) 0.28s both; }
  .bar-3 { animation: fillBar 0.7s cubic-bezier(0.22,1,0.36,1) 0.42s both; }

  /* 스탯 pop */
  @keyframes statPop {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  .stat-num { animation: statPop 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
`;

function enhance(raw: string): string {
  return raw.replace(/(<svg[^>]*>)/, `$1<style>${CSS}</style>${INJECTED}`);
}

export async function GET() {
  try {
    const [data, { r, b }] = await Promise.all([
      fetchGitHubData(),
      Promise.resolve(getFonts()),
    ]);

    const raw = await satori(createElement(StatsCard, data), {
      width: W, height: H,
      fonts: [
        { name: "JetBrains Mono", data: r, weight: 400, style: "normal" },
        { name: "JetBrains Mono", data: b, weight: 700, style: "normal" },
      ],
    });

    return new Response(enhance(raw), {
      status: 200,
      headers: {
        "Content-Type":  "image/svg+xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[/api/stats]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="80">
        <rect width="${W}" height="80" fill="#140D2E" rx="8"/>
        <text x="20" y="46" fill="#5B8DEF" font-size="12" font-family="monospace">Error: ${msg}</text>
      </svg>`,
      { status: 500, headers: { "Content-Type": "image/svg+xml" } }
    );
  }
}

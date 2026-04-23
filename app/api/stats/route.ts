import satori from "satori";
import { createElement } from "react";
import { readFileSync } from "fs";
import { join } from "path";
import StatsCard from "@/app/components/StatsCard";
import { fetchGitHubData, MOCK_DATA } from "@/lib/github";
import { redis } from "@/lib/redis";

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

const CSS = `
  @keyframes fillBar {
    from { transform: scaleX(0); transform-origin: left center; }
    to   { transform: scaleX(1); transform-origin: left center; }
  }
  .bar-0 { animation: fillBar 0.7s cubic-bezier(0.22,1,0.36,1) 0.00s both; }
  .bar-1 { animation: fillBar 0.7s cubic-bezier(0.22,1,0.36,1) 0.14s both; }
  .bar-2 { animation: fillBar 0.7s cubic-bezier(0.22,1,0.36,1) 0.28s both; }
  .bar-3 { animation: fillBar 0.7s cubic-bezier(0.22,1,0.36,1) 0.42s both; }

  @keyframes statPop {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  .stat-num { animation: statPop 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
`;

function enhance(raw: string): string {
  return raw.replace(/(<svg[^>]*>)/, `$1<style>${CSS}</style>`);
}

function satoriOptions(r: ArrayBuffer, b: ArrayBuffer) {
  return {
    width: W, height: H,
    fonts: [
      { name: "JetBrains Mono", data: r, weight: 400 as const, style: "normal" as const },
      { name: "JetBrains Mono", data: b, weight: 700 as const, style: "normal" as const },
    ],
  };
}

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { r, b } = getFonts();

    // 방문자 카운트 + GitHub 데이터 병렬 처리
    const [visitorTotal, visitorToday] = await Promise.all([
      redis.incr("visits:total"),
      redis.incr(`visits:${today}`),
    ]);

    const data = await fetchGitHubData(visitorToday, visitorTotal);

    const raw = await satori(createElement(StatsCard, data), satoriOptions(r, b));

    return new Response(enhance(raw), {
      status: 200,
      headers: {
        "Content-Type":  "image/svg+xml",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[/api/stats]", err);

    // 항상 200 반환 — GitHub camo 프록시가 5xx를 캐시하면 엑박이 지속됨
    try {
      const { r, b } = getFonts();
      const raw = await satori(
        createElement(StatsCard, { ...MOCK_DATA, visitorToday: 0, visitorTotal: 0 }),
        satoriOptions(r, b),
      );
      return new Response(enhance(raw), {
        status: 200,
        headers: {
          "Content-Type":  "image/svg+xml",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      // Satori 자체가 실패한 최후의 경우 — 전체 사이즈 SVG로 200 반환
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
          <rect width="${W}" height="${H}" fill="#0F111A" rx="24"/>
          <text x="450" y="260" fill="#6CABDD" font-size="14" font-family="monospace" text-anchor="middle">잠시 후 다시 시도해주세요</text>
        </svg>`,
        { status: 200, headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" } }
      );
    }
  }
}

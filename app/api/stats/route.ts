import satori from "satori";
import { createElement } from "react";
import { readFileSync } from "fs";
import { join } from "path";
import { after, type NextRequest } from "next/server";
import StatsCard, { CARD_HEIGHT, CARD_WIDTH, type ThemeName } from "@/app/components/StatsCard";
import { withOverlay } from "@/app/components/overlay";
import { EMPTY_DATA, loadStats } from "@/lib/github";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ── 폰트 (인스턴스당 한 번만 로드) ────────────────────────────────────────────

// 폰트는 node_modules에서 직접 읽습니다 (next.config.ts의 outputFileTracingIncludes로 번들 포함 보장).
const FONT_DIR = join(process.cwd(), "node_modules/@fontsource");

function read(path: string): ArrayBuffer {
  const buf = readFileSync(path);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

type Fonts = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: "normal" }[];
let fonts: Fonts | null = null;

function getFonts(): Fonts {
  fonts ??= [
    { name: "Geist", data: read(join(FONT_DIR, "geist-sans/files/geist-sans-latin-400-normal.woff")), weight: 400, style: "normal" },
    { name: "Geist", data: read(join(FONT_DIR, "geist-sans/files/geist-sans-latin-500-normal.woff")), weight: 500, style: "normal" },
    { name: "Geist", data: read(join(FONT_DIR, "geist-sans/files/geist-sans-latin-600-normal.woff")), weight: 600, style: "normal" },
    { name: "Geist Mono", data: read(join(FONT_DIR, "geist-mono/files/geist-mono-latin-400-normal.woff")), weight: 400, style: "normal" },
    { name: "Geist Mono", data: read(join(FONT_DIR, "geist-mono/files/geist-mono-latin-500-normal.woff")), weight: 500, style: "normal" },
  ];
  return fonts;
}

// ── 응답 ──────────────────────────────────────────────────────────────────────

function svgResponse(svg: string): Response {
  return new Response(svg, {
    // 항상 200 — GitHub camo 프록시는 에러 응답을 엑박으로 표시합니다.
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // 방문자 수가 매 조회마다 갱신되도록 프록시 캐시를 막습니다.
      "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
    },
  });
}

function plainFallback(theme: ThemeName): string {
  const [bg, fg] = theme === "light" ? ["#FFFFFF", "#52525B"] : ["#09090B", "#A1A1AA"];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="24" fill="${bg}"/>
  <text x="${CARD_WIDTH / 2}" y="${CARD_HEIGHT / 2}" fill="${fg}" font-size="14" font-family="ui-monospace, monospace" text-anchor="middle">Stats are warming up. Please refresh in a moment.</text>
</svg>`;
}

export async function GET(request: NextRequest) {
  const theme: ThemeName = request.nextUrl.searchParams.get("theme") === "light" ? "light" : "dark";

  try {
    const { data, visitors, refresh } = await loadStats().catch((err) => {
      console.error("[/api/stats] loadStats failed:", err);
      return { data: EMPTY_DATA, visitors: null, refresh: null };
    });

    // GitHub API 갱신은 응답을 보낸 뒤에 실행 — 요청 경로를 느리게 만들지 않습니다.
    if (refresh) after(refresh);

    const svg = await satori(createElement(StatsCard, { data, visitors, theme }), {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts: getFonts(),
    });
    return svgResponse(withOverlay(svg, data, theme));
  } catch (err) {
    console.error("[/api/stats] render failed:", err);
    return svgResponse(plainFallback(theme));
  }
}

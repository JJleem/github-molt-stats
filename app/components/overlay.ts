/**
 * Satori가 만든 SVG에 직접 그린 레이어를 더합니다.
 *
 * - 뒤: 카드 배경과 테두리
 * - 앞: 기여 히트맵 (셀 수백 개를 Satori로 그리면 SVG가 수십 KB 커지므로 직접 그립니다)
 */

import type { GitHubStats } from "@/lib/github";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  CELL_PAD,
  GAP,
  HEAT_HEIGHT,
  HEAT_WEEKS,
  HEAT_WIDTH,
  PAD,
  SIDE_WIDTH,
  THEMES,
  TOP_ROW_HEIGHT,
  type Theme,
  type ThemeName,
} from "./StatsCard";

const RADIUS = 24;
const PIXEL = 10;
const STEP = 13;

// 카드 테두리(1px) 안쪽에서 칸이 시작하는 좌표
const ORIGIN = 1 + PAD;
const HEAT = {
  x: ORIGIN + SIDE_WIDTH + GAP + 1 + CELL_PAD,
  y: ORIGIN + TOP_ROW_HEIGHT - 1 - CELL_PAD - HEAT_HEIGHT,
};

const round = (n: number) => Math.round(n * 10) / 10;

function backdrop(t: Theme): string {
  const frame = `x="0.5" y="0.5" width="${CARD_WIDTH - 1}" height="${CARD_HEIGHT - 1}" rx="${RADIUS}"`;
  return (
    `<rect ${frame} fill="${t.page}"/>` +
    `<rect ${frame} fill="none" stroke="${t.border}"/>`
  );
}

function heatmap(t: Theme, weeks: string[]): string {
  const recent = weeks.slice(-HEAT_WEEKS);
  // 데이터가 모자라면 빈 주로 채워 폭을 유지합니다.
  const padded = [...Array<string>(Math.max(0, HEAT_WEEKS - recent.length)).fill("0000000"), ...recent];
  const step = (HEAT_WIDTH - PIXEL) / (HEAT_WEEKS - 1);
  const cells = padded.flatMap((week, wi) =>
    week.split("").map((level, di) => {
      const fill = t.heat[Number(level)] ?? t.heat[0];
      return `<rect x="${round(wi * step)}" y="${di * STEP}" width="${PIXEL}" height="${PIXEL}" rx="3" fill="${fill}"/>`;
    }),
  );
  return `<g transform="translate(${HEAT.x},${HEAT.y})">${cells.join("")}</g>`;
}

export function withOverlay(svg: string, data: GitHubStats, theme: ThemeName): string {
  const t = THEMES[theme];
  const start = svg.indexOf(">") + 1;
  const end = svg.lastIndexOf("</svg>");
  if (start === 0 || end === -1) return svg;
  return svg.slice(0, start) + backdrop(t) + svg.slice(start, end) + heatmap(t, data.heat) + svg.slice(end);
}

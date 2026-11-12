/**
 * Satori가 만든 정적 SVG에 직접 그린 레이어를 더합니다.
 *
 * - 뒤: 카드 배경 + 잔디(기여 그래프) 모양 픽셀 격자. 그 뒤로 부드러운 물결이 흘러 픽셀이 밝아졌다 어두워집니다.
 * - 앞: 기여 히트맵.
 *
 * Satori는 class나 <style>을 출력하지 않아 애니메이션을 붙일 수 없으므로 SVG 문자열로 직접 만듭니다.
 * README의 <img> 안에서도 SMIL 애니메이션(<animateTransform>)은 재생됩니다 (스크립트는 불가).
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

/** 물결이 없는 곳의 픽셀 밝기 */
const BASE_OPACITY = 0.03;

/**
 * 카드를 가로지르는 물결들. 사인 곡선을 한 주기(period)만큼 옆으로 옮기는 것을 반복하므로
 * 이음매 없이 계속 흘러갑니다. seconds는 한 주기를 지나는 시간이고, 음수면 반대 방향입니다.
 * (너무 느리거나 띠가 넓으면 픽셀 밝기 변화가 눈에 안 띄어 멈춘 것처럼 보입니다.)
 */
const WAVES = [
  { y: 140, amplitude: 44, period: 450, seconds: 7, strength: 0.1 },
  { y: 285, amplitude: 36, period: 300, seconds: -5.5, strength: 0.085 },
  { y: 425, amplitude: 48, period: 450, seconds: 9, strength: 0.1 },
];
/** 물결 띠의 두께 단계 — 겹쳐 그려서 가장자리가 부드럽게 번지게 합니다. */
const BAND_WIDTHS = [58, 38, 20];

const round = (n: number) => Math.round(n * 10) / 10;

/** 좌표로 정해지는 고정 난수(0~9) — 요청마다 무늬가 바뀌지 않게 합니다. */
function noise(col: number, row: number): number {
  let h = (col * 374761393 + row * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) % 10;
}

/** 부드러운 물결 띠들. 이 위에 격자 스텐실을 덮어 픽셀 모양으로만 보이게 합니다. */
function waveBands(t: Theme): string {
  return WAVES.map((w) => {
    const halves = Math.ceil((CARD_WIDTH + w.period) / (w.period / 2));
    // 2차 곡선의 봉우리는 제어점 높이의 절반이므로 진폭의 두 배를 줍니다.
    const d =
      `M0,${w.y} q${w.period / 4},${-w.amplitude * 2} ${w.period / 2},0` + ` t${w.period / 2},0`.repeat(halves - 1);
    const strokes = BAND_WIDTHS.map(
      (width) => `<path d="${d}" stroke-width="${width}" stroke-opacity="${w.strength}"/>`,
    ).join("");
    // SMIL 애니메이션 — <img>로 삽입된 SVG에서도 재생됩니다. 역방향은 한 주기 왼쪽에서 출발합니다.
    const [from, to] = w.seconds > 0 ? [0, -w.period] : [-w.period, 0];
    return (
      `<g>${strokes}<animateTransform attributeName="transform" type="translate" from="${from} 0" to="${to} 0" ` +
      `dur="${Math.abs(w.seconds)}s" repeatCount="indefinite"/></g>`
    );
  }).join("");
}

/**
 * 잔디 모양 픽셀 격자. 물결 띠 위에 배경색 격자선을 덮어, 색이 10px 칸으로만 비쳐 보이게 합니다.
 * (픽셀마다 애니메이션을 거는 대신 뒤의 물결만 움직이므로 움직임이 끊기지 않습니다.)
 */
function pixelField(t: Theme): string {
  const cols = Math.floor((CARD_WIDTH - PIXEL) / STEP) + 1;
  const rows = Math.floor((CARD_HEIGHT - PIXEL) / STEP) + 1;
  const offsetX = (CARD_WIDTH - ((cols - 1) * STEP + PIXEL)) / 2;
  const offsetY = (CARD_HEIGHT - ((rows - 1) * STEP + PIXEL)) / 2;
  const gutter = STEP - PIXEL;

  // 픽셀 사이를 가리는 가로·세로 격자선 (바깥 여백 포함)
  let lines = "";
  for (let col = 0; col <= cols; col++) {
    const x = round(offsetX + col * STEP - gutter / 2);
    lines += `M${x},0V${CARD_HEIGHT}`;
  }
  for (let row = 0; row <= rows; row++) {
    const y = round(offsetY + row * STEP - gutter / 2);
    lines += `M0,${y}H${CARD_WIDTH}`;
  }
  // 교차점마다 둥근 점을 찍어 픽셀 모서리를 살짝 굴립니다.
  let corners = "";
  for (let row = 0; row <= rows; row++) {
    const y = round(offsetY + row * STEP - gutter / 2);
    corners += `M${round(offsetX - gutter / 2)},${y}H${CARD_WIDTH}`;
  }

  // 잔디처럼 칸마다 진하기가 다르도록 일부 픽셀을 배경색으로 눌러 줍니다.
  const dim = ["", ""];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const n = noise(col, row);
      if (n >= 7) continue;
      dim[n < 4 ? 0 : 1] += `M${round(offsetX + col * STEP)},${round(offsetY + row * STEP)}h${PIXEL}v${PIXEL}h-${PIXEL}z`;
    }
  }

  return (
    `<g clip-path="url(#card-clip)">` +
    `<rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${t.accent}" fill-opacity="${BASE_OPACITY}"/>` +
    `<g fill="none" stroke="${t.accent}" stroke-linecap="round">${waveBands(t)}</g>` +
    `<path d="${dim[0]}" fill="${t.page}" fill-opacity="0.6"/>` +
    `<path d="${dim[1]}" fill="${t.page}" fill-opacity="0.3"/>` +
    `<path d="${lines}" fill="none" stroke="${t.page}" stroke-width="${gutter}"/>` +
    `<path d="${corners}" fill="none" stroke="${t.page}" stroke-width="${gutter + 3}" stroke-linecap="round" stroke-dasharray="0 ${STEP}"/>` +
    `</g>`
  );
}

function backdrop(t: Theme): string {
  const frame = `x="0.5" y="0.5" width="${CARD_WIDTH - 1}" height="${CARD_HEIGHT - 1}" rx="${RADIUS}"`;
  return (
    `<clipPath id="card-clip"><rect ${frame}/></clipPath>` +
    `<rect ${frame} fill="${t.page}"/>` +
    pixelField(t) +
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

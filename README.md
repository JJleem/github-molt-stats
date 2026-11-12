# github-molt-stats

GitHub 프로필 README에 삽입할 수 있는 **동적 Stats 카드** 생성기입니다.
Next.js App Router + Satori로 SVG를 서버 사이드 렌더링하며, GitHub GraphQL API에서 실시간 데이터를 가져옵니다.

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://github-molt-stats.vercel.app/api/stats?theme=light">
  <img alt="preview" src="https://github-molt-stats.vercel.app/api/stats?theme=dark">
</picture>

---

## Features

- **Total Contributions** — 전체 기여 수 + 최근 12개월 기여 수, 기여 히트맵
- **Streak / Stars / Merged PRs** — 현재 연속 기여일, 보유 레포 스타, 머지된 PR 수
- **Visitors** — 오늘 / 누적 조회 수 (Upstash Redis)
- **Top Languages** — 코드 사이즈 기반 상위 5개 언어
- **Recently Active** — 최근 푸시한 공개 레포 3개
- **픽셀 물결 배경** — 잔디 모양 격자 뒤로 물결이 흐르는 애니메이션 (README 안에서도 재생)
- **라이트 / 다크 테마** — `?theme=light` · `?theme=dark` (기본값)
- GITHUB_TOKEN 없을 때 Mock 데이터로 자동 fallback (로컬 디자인 확인용)

---

## 안정성: 엑박이 뜨지 않게

GitHub는 README 이미지를 자체 프록시(camo)로 가져오는데, 응답이 몇 초만 늦어도 깨진 이미지로 표시합니다.
GitHub GraphQL 집계는 5~9초가 걸리므로 요청 경로에서 호출하지 않습니다.

- 요청이 오면 Redis에 저장된 **스냅샷**으로 즉시 렌더링합니다 (방문자 카운트와 스냅샷 조회는 한 번의 왕복).
- 스냅샷이 30분보다 오래됐으면 **응답을 보낸 뒤** `after()`에서 GitHub 데이터를 갱신합니다.
- 스냅샷은 만료 없이 보관하므로 GitHub API나 토큰에 문제가 생겨도 마지막 성공 데이터가 계속 표시됩니다.
- 아바타는 스냅샷에 base64로 함께 저장해 렌더링 중 네트워크 요청이 없습니다.
- Redis가 1.5초 안에 응답하지 않으면 방문자 수만 `—`로 표시하고 카드는 그대로 그립니다.

---

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Satori](https://github.com/vercel/satori) — JSX → SVG 렌더링
- [GitHub GraphQL API v4](https://docs.github.com/en/graphql)
- [Upstash Redis](https://upstash.com) — 스냅샷 캐시 + 방문자 카운터
- TypeScript
- Deployed on [Vercel](https://vercel.com)

---

## Getting Started

```bash
git clone https://github.com/JJleem/github-molt-stats.git
cd github-molt-stats
npm install
```

`.env.local` 파일 생성:

```env
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_USERNAME=your_github_username
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

> 네 값 모두 선택입니다. 토큰이 없으면 Mock 데이터로, Redis가 없으면 캐시·방문자 수 없이 동작합니다.

> **GITHUB_TOKEN** 권한: `read:user`, `repo` (public only면 `public_repo`)

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) — 다크/라이트 환경 프리뷰 확인

---

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JJleem/github-molt-stats)

1. Vercel에 레포 import
2. Environment Variables에 `GITHUB_TOKEN`, `GITHUB_USERNAME`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 추가
3. Deploy

---

## Usage

배포 후 GitHub 프로필 README에 아래처럼 추가하면 보는 사람의 테마에 맞는 카드가 표시됩니다:

```html
<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://your-vercel-domain.vercel.app/api/stats?theme=light">
  <img alt="GitHub Stats" src="https://your-vercel-domain.vercel.app/api/stats?theme=dark">
</picture>
```

한 가지 테마만 쓸 때는 마크다운 이미지 문법으로도 충분합니다:

```markdown
![GitHub Stats](https://your-vercel-domain.vercel.app/api/stats)
```

---

## Customization

| 파일 | 설명 |
|------|------|
| `lib/config.ts` | 이름, 직함, 슬로건, 집계 시작 연도 |
| `app/components/StatsCard.tsx` | 카드 디자인 (테마 색상, 레이아웃) |
| `app/components/overlay.ts` | 배경 픽셀 물결(속도·진하기), 기여 히트맵 |
| `lib/github.ts` | GraphQL 쿼리, 스냅샷 캐시, Mock 데이터 |
| `app/api/stats/route.ts` | SVG 렌더링, 응답 헤더 |

---

## License

MIT

# github-molt-stats

GitHub 프로필 README에 삽입할 수 있는 **동적 Stats 카드** 생성기입니다.
Next.js App Router + Satori로 SVG를 서버 사이드 렌더링하며, GitHub GraphQL API에서 실시간 데이터를 가져옵니다.

![preview](https://github-molt-stats.vercel.app/api/stats)

---

## Features

- **Total Contributions** — 2016년부터 현재까지 전체 기여 수 합산
- **Streak** — 연속 기여일 수
- **Stars / Pull Requests** — 보유 레포 전체 스타 및 머지된 PR 수
- **Top Languages** — 코드 사이즈 기반 상위 4개 언어 + 그라데이션 바
- **Tech Stack Badges** — 커스텀 스택 뱃지
- **JetBrains Mono** 폰트 + 다크 테마 디자인
- GITHUB_TOKEN 없을 때 Mock 데이터 자동 fallback

---

## Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [Satori](https://github.com/vercel/satori) — JSX → SVG 렌더링
- [GitHub GraphQL API v4](https://docs.github.com/en/graphql)
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
```

> **GITHUB_TOKEN** 권한: `read:user`, `repo` (public only면 `public_repo`)

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) — 다크/라이트 환경 프리뷰 확인

---

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JJleem/github-molt-stats)

1. Vercel에 레포 import
2. Environment Variables에 `GITHUB_TOKEN`, `GITHUB_USERNAME` 추가
3. Deploy

---

## Usage

배포 후 GitHub 프로필 README에 아래처럼 추가:

```markdown
![GitHub Stats](https://your-vercel-domain.vercel.app/api/stats)
```

SVG로 반환되므로 `<img>` 태그나 마크다운 이미지 문법 모두 동작합니다.

---

## Customization

| 파일 | 설명 |
|------|------|
| `app/components/StatsCard.tsx` | 카드 디자인 (색상, 레이아웃, 뱃지) |
| `lib/github.ts` | GraphQL 쿼리, Mock 데이터 |
| `app/api/stats/route.ts` | SVG 렌더링, 캐시 설정 |

`BADGE_ROWS` 배열을 수정해 자신의 기술 스택으로 교체하세요.

---

## License

MIT

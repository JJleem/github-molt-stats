import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 카드 렌더링에 쓰는 폰트 파일이 서버리스 번들에 반드시 포함되도록 명시합니다.
  outputFileTracingIncludes: {
    "/api/stats": [
      "./node_modules/@fontsource/geist-sans/files/geist-sans-latin-*-normal.woff",
      "./node_modules/@fontsource/geist-mono/files/geist-mono-latin-*-normal.woff",
    ],
  },
};

export default nextConfig;

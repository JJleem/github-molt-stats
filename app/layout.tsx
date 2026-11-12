import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "github-molt-stats",
  description: "GitHub 프로필 README용 동적 Stats 카드",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

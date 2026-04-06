export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      // GitHub 다크모드 색상으로 미리보기 — 실제 환경 시뮬레이션
      background: "#0d1117",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 32,
      padding: 48,
    }}>
      {/* GitHub 다크모드 위에서 확인 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/api/stats"
        alt="MOLT GitHub Stats"
        width={900}
        height={480}
        style={{ borderRadius: 20, maxWidth: "100%" }}
      />

      {/* GitHub 라이트모드 시뮬레이션 */}
      <div style={{
        background: "#ffffff",
        padding: 24,
        borderRadius: 12,
        width: "100%",
        maxWidth: 900,
        boxSizing: "border-box" as const,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/api/stats"
          alt="MOLT GitHub Stats"
          width={900}
          height={560}
          style={{ borderRadius: 20, maxWidth: "100%", display: "block" }}
        />
      </div>

      <a href="/api/stats" style={{ fontSize: 10, color: "#444", textDecoration: "none" }}>
        /api/stats
      </a>
    </main>
  );
}

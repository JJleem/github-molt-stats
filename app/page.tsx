const PREVIEWS = [
  { theme: "dark", label: "GitHub dark", background: "#0d1117", color: "#8b949e" },
  { theme: "light", label: "GitHub light", background: "#ffffff", color: "#59636e" },
] as const;

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {PREVIEWS.map(({ theme, label, background, color }) => (
        <section
          key={theme}
          style={{
            flex: 1,
            background,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "48px 24px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/stats?theme=${theme}`}
            alt={`GitHub stats card, ${theme} theme`}
            width={900}
            height={520}
            style={{ maxWidth: "100%", height: "auto" }}
          />
          <a
            href={`/api/stats?theme=${theme}`}
            style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color, textDecoration: "none" }}
          >
            {label} · /api/stats?theme={theme}
          </a>
        </section>
      ))}
    </main>
  );
}

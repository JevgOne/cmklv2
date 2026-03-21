"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="cs">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "28rem" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#18181B",
                marginBottom: "0.5rem",
              }}
            >
              Nastala neocekavana chyba
            </h2>
            <p style={{ color: "#71717A", marginBottom: "1.5rem" }}>
              Omlouvame se, doslo k zavazne chybe. Zkuste to prosim znovu.
            </p>
            <button
              onClick={reset}
              style={{
                backgroundColor: "#F97316",
                color: "white",
                border: "none",
                borderRadius: "9999px",
                padding: "0.75rem 2rem",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Zkusit znovu
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

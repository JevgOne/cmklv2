import { readFile } from "fs/promises";
import { join } from "path";

export const OG_SIZE = { width: 1200, height: 630 };

// Brand colors
export const ORANGE = "#F97316";

let cachedLogo: string | null = null;

export async function getLogoBase64(): Promise<string> {
  if (cachedLogo) return cachedLogo;
  const logoData = await readFile(join(process.cwd(), "public/brand/logo-white.png"));
  cachedLogo = `data:image/png;base64,${logoData.toString("base64")}`;
  return cachedLogo;
}

/**
 * Base OG image layout — dark gradient background with CarMakler logo.
 * All children must be wrapped in a single container with display:flex.
 */
export function OgLayout({
  logo,
  children,
  bgImage,
}: {
  logo: string;
  children: React.ReactNode;
  bgImage?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #080818 0%, #1a1a2e 30%, #16213e 65%, #0f3460 100%)",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background photo overlay — always rendered, hidden if no image */}
      <img
        src={bgImage || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: bgImage ? 0.25 : 0,
          display: "flex",
        }}
      />
      {/* Decorative gradient orb */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
          display: "flex",
        }}
      />
      {/* Logo */}
      <img
        src={logo}
        alt="CarMakléř"
        style={{ height: 64, marginBottom: 24, position: "relative" }}
      />
      {/* Orange accent line */}
      <div
        style={{
          width: 50,
          height: 3,
          background: ORANGE,
          marginBottom: 24,
          position: "relative",
          display: "flex",
        }}
      />
      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          maxWidth: 900,
          padding: "0 40px",
        }}
      >
        {children}
      </div>
      {/* Bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 4,
          background: `linear-gradient(90deg, transparent, ${ORANGE}, transparent)`,
          display: "flex",
        }}
      />
      {/* URL watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 40,
          fontSize: 14,
          color: "rgba(255,255,255,0.4)",
          display: "flex",
        }}
      >
        www.carmakler.cz
      </div>
    </div>
  );
}

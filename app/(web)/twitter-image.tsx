import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64 } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "CarMakléř — kompletní automobilová platforma";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const logo = await getLogoBase64();

  return new ImageResponse(
    (
      <OgLayout logo={logo}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
            display: "flex",
          }}
        >
          Kompletní automobilová platforma
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.7)",
            marginTop: 20,
            textAlign: "center",
            display: "flex",
          }}
        >
          Prodej aut · Inzerce · Autodíly · Marketplace
        </div>
      </OgLayout>
    ),
    { ...size },
  );
}

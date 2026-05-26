import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE, ogImageOptions } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Jak prodat auto — CarMakléř";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const logo = await getLogoBase64();
  const options = await ogImageOptions();

  return new ImageResponse(
    (
      <OgLayout logo={logo}>
        <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: "white", textAlign: "center", lineHeight: 1.2 }}>
          <span>Jak prodat auto </span>
          <span style={{ color: ORANGE, marginLeft: 14 }}>rychle a bezpečně</span>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.7)", marginTop: 20, textAlign: "center" }}>
          Kompletní průvodce prodejem auta v Česku
        </div>
      </OgLayout>
    ),
    options,
  );
}

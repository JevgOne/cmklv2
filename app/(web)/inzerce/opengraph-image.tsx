import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "CarMakléř Inzerce — prodejte své auto online";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const logo = await getLogoBase64();

  return new ImageResponse(
    (
      <OgLayout logo={logo}>
        <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: "white", textAlign: "center", lineHeight: 1.2 }}>
          <span>Inzerce </span>
          <span style={{ color: ORANGE, marginLeft: 14 }}>vozidel</span>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.7)", marginTop: 20, textAlign: "center" }}>
          Podejte inzerát zdarma · Oslovte tisíce kupujících · AI generování popisů
        </div>
      </OgLayout>
    ),
    { ...size },
  );
}

import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "CarMakléř — síť certifikovaných makléřů";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const logo = await getLogoBase64();

  return new ImageResponse(
    (
      <OgLayout logo={logo}>
        <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: "white", textAlign: "center", lineHeight: 1.2 }}>
          <span>Certifikovaní </span>
          <span style={{ color: ORANGE, marginLeft: 14 }}>makléři</span>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.7)", marginTop: 20, textAlign: "center" }}>
          Profesionální zprostředkování prodeje vozidel po celé ČR
        </div>
      </OgLayout>
    ),
    { ...size },
  );
}

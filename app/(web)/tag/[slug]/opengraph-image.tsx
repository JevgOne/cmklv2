import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE, ogImageOptions } from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "CarMakléř Blog";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const logo = await getLogoBase64();
  const options = await ogImageOptions();

  const name = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return new ImageResponse(
    (
      <OgLayout logo={logo}>
        <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: "white", textAlign: "center", lineHeight: 1.2 }}>
          <span>Články: </span>
          <span style={{ color: ORANGE, marginLeft: 14 }}>#{name}</span>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.7)", marginTop: 20, textAlign: "center" }}>
          {`Články označené tagem #${name}`}
        </div>
      </OgLayout>
    ),
    options,
  );
}

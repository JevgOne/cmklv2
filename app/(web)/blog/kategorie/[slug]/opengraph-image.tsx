import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE, ogImageOptions } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "CarMakléř Blog";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const logo = await getLogoBase64();
  const options = await ogImageOptions();

  const cat = await prisma.articleCategory.findUnique({
    where: { slug },
    select: { name: true, description: true, icon: true },
  });

  const highlightText = cat
    ? (cat.icon ? `${cat.icon} ${cat.name}` : cat.name)
    : slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const subtitle = cat
    ? (cat.description || `Články z kategorie ${cat.name}`)
    : `Články z kategorie ${slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`;

  return new ImageResponse(
    (
      <OgLayout logo={logo}>
        <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: "white", textAlign: "center", lineHeight: 1.2 }}>
          <span>Blog: </span>
          <span style={{ color: ORANGE, marginLeft: 14 }}>{highlightText}</span>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.7)", marginTop: 20, textAlign: "center" }}>
          {subtitle}
        </div>
      </OgLayout>
    ),
    options,
  );
}

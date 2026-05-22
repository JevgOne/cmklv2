import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE, ogImageOptions } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";
import { getOptimizedUrl } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const alt = "Autodíl na CarMakléř";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const logo = await getLogoBase64();
  const options = await ogImageOptions();

  const part = await prisma.part.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: {
      name: true,
      price: true,
      condition: true,
      category: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  });

  if (!part) {
    return new ImageResponse(
      (
        <OgLayout logo={logo}>
          <div style={{ display: "flex", fontSize: 42, fontWeight: 800, color: "white" }}>
            <span>Autodíl na </span>
            <span style={{ color: ORANGE, marginLeft: 10 }}>CarMakléř</span>
          </div>
        </OgLayout>
      ),
      options,
    );
  }

  const rawImage = part.images?.[0]?.url;
  const partImage = rawImage ? getOptimizedUrl(rawImage, 1200, "auto") : undefined;
  const price = new Intl.NumberFormat("cs-CZ").format(part.price);

  return new ImageResponse(
    (
      <OgLayout logo={logo} bgImage={partImage}>
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {part.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 28,
            fontWeight: 700,
            color: ORANGE,
          }}
        >
          {price} Kč
        </div>
      </OgLayout>
    ),
    options,
  );
}

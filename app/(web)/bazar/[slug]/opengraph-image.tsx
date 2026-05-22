import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE, ogImageOptions } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";
import { getOptimizedUrl } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const alt = "Autobazar na CarMakléř";
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

  const partner = await prisma.partner.findUnique({
    where: { slug },
    select: { name: true, city: true, logo: true, googleRating: true, googleReviewCount: true },
  });

  if (!partner) {
    return new ImageResponse(
      (
        <OgLayout logo={logo}>
          <div style={{ display: "flex", fontSize: 42, fontWeight: 800, color: "white" }}>
            <span>Autobazar na </span>
            <span style={{ color: ORANGE, marginLeft: 10 }}>CarMakléř</span>
          </div>
        </OgLayout>
      ),
      options,
    );
  }

  const bgImage = partner.logo ? getOptimizedUrl(partner.logo, 1200, "auto") : undefined;
  const rating = partner.googleRating ? `${partner.googleRating.toFixed(1)}★` : null;
  const details = [partner.city, rating, partner.googleReviewCount ? `${partner.googleReviewCount} recenzí` : null].filter(Boolean).join("  ·  ");

  return new ImageResponse(
    (
      <OgLayout logo={logo} bgImage={bgImage}>
        <div
          style={{
            display: "flex",
            fontSize: 46,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {partner.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 24,
            fontWeight: 700,
            color: ORANGE,
          }}
        >
          Ověřený autobazar
        </div>
        {details && (
          <div
            style={{
              display: "flex",
              marginTop: 12,
              fontSize: 22,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {details}
          </div>
        )}
      </OgLayout>
    ),
    options,
  );
}

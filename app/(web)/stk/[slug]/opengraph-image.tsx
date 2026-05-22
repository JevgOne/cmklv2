import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE, ogImageOptions } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "STK stanice na CarMakléř";
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

  const servis = await prisma.autoServis.findUnique({
    where: { slug },
    select: { name: true, city: true, averageRating: true, reviewCount: true, stkWaitDays: true },
  });

  if (!servis) {
    return new ImageResponse(
      (
        <OgLayout logo={logo}>
          <div style={{ display: "flex", fontSize: 42, fontWeight: 800, color: "white" }}>
            <span>STK stanice na </span>
            <span style={{ color: ORANGE, marginLeft: 10 }}>CarMakléř</span>
          </div>
        </OgLayout>
      ),
      options,
    );
  }

  const rating = servis.averageRating > 0 ? `${servis.averageRating.toFixed(1)}★` : null;
  const waitDays = servis.stkWaitDays != null ? `Čekací doba ${servis.stkWaitDays} dní` : null;
  const details = [servis.city, rating, servis.reviewCount > 0 ? `${servis.reviewCount} recenzí` : null].filter(Boolean).join("  ·  ");

  return new ImageResponse(
    (
      <OgLayout logo={logo}>
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
          {servis.name}
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
          STK stanice
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
        {waitDays && (
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontSize: 18,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            {waitDays}
          </div>
        )}
      </OgLayout>
    ),
    options,
  );
}

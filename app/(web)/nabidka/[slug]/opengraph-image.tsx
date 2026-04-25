import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Vozidlo na CarMakléř";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const logo = await getLogoBase64();

  // Try Vehicle first, then Listing
  const vehicle = await prisma.vehicle.findFirst({
    where: { slug },
    select: {
      brand: true,
      model: true,
      variant: true,
      year: true,
      price: true,
      city: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  });

  const listing = vehicle
    ? null
    : await prisma.listing.findFirst({
        where: { slug },
        select: {
          brand: true,
          model: true,
          variant: true,
          year: true,
          price: true,
          city: true,
          images: { take: 1, select: { url: true }, orderBy: { order: "asc" } },
        },
      });

  const item = vehicle || listing;
  if (!item) {
    // Fallback to default
    return new ImageResponse(
      (
        <OgLayout logo={logo}>
          <div style={{ fontSize: 42, fontWeight: 800, color: "white" }}>
            Vozidlo na <span style={{ color: ORANGE }}>CarMakléř</span>
          </div>
        </OgLayout>
      ),
      { ...size },
    );
  }

  const name = `${item.brand} ${item.model}${item.variant ? " " + item.variant : ""}`;
  const price = new Intl.NumberFormat("cs-CZ").format(item.price);
  const carImage = item.images?.[0]?.url;

  return new ImageResponse(
    (
      <OgLayout logo={logo} bgImage={carImage}>
        <div
          style={{
            fontSize: 46,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 24,
            fontSize: 22,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <span>{item.year}</span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
          <span style={{ color: ORANGE, fontWeight: 700 }}>{price} Kč</span>
          {item.city && (
            <>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
              <span>{item.city}</span>
            </>
          )}
        </div>
      </OgLayout>
    ),
    { ...size },
  );
}

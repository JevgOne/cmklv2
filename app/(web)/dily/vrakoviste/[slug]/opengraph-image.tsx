import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE, ogImageOptions } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Vrakoviště — CarMakléř";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const logo = await getLogoBase64();
  const options = await ogImageOptions();

  const supplier = await prisma.user.findFirst({
    where: { slug, role: { in: ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE"] } },
    select: { companyName: true, city: true },
  });

  const name = supplier?.companyName || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const subtitle = supplier?.city ? `Autodíly z vrakoviště v ${supplier.city}` : "Autodíly od ověřeného dodavatele";

  return new ImageResponse(
    (
      <OgLayout logo={logo}>
        <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: "white", textAlign: "center", lineHeight: 1.2 }}>
          <span style={{ color: ORANGE }}>{name}</span>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.7)", marginTop: 20, textAlign: "center" }}>
          {subtitle}
        </div>
      </OgLayout>
    ),
    options,
  );
}

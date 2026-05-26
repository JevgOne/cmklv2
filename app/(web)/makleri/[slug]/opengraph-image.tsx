import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE, ogImageOptions } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Certifikovaný makléř — CarMakléř";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const logo = await getLogoBase64();
  const options = await ogImageOptions();

  const broker = await prisma.user.findFirst({
    where: { slug, role: "BROKER" },
    select: { firstName: true, lastName: true, city: true },
  });

  const name = broker ? `${broker.firstName} ${broker.lastName}` : "Certifikovaný makléř";
  const subtitle = broker?.city ? `Automakléř v ${broker.city}` : "Certifikovaný automakléř CarMakléř";

  return new ImageResponse(
    (
      <OgLayout logo={logo}>
        <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: "white", textAlign: "center", lineHeight: 1.2 }}>
          <span>Makléř </span>
          <span style={{ color: ORANGE, marginLeft: 14 }}>{name}</span>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.7)", marginTop: 20, textAlign: "center" }}>
          {subtitle}
        </div>
      </OgLayout>
    ),
    options,
  );
}

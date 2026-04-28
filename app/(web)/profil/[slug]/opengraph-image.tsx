import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/seo-data";

export const runtime = "nodejs";
export const alt = "Profil na CarMakléř";
export const size = OG_SIZE;
export const contentType = "image/png";

const ROLE_LABELS: Record<string, string> = {
  BROKER: "Makléř",
  ADMIN: "Admin",
  BACKOFFICE: "BackOffice",
  REGIONAL_DIRECTOR: "Regionální ředitel",
  MANAGER: "Manažer",
  ADVERTISER: "Inzerent",
  BUYER: "Kupující",
  PARTS_SUPPLIER: "Dodavatel dílů",
  INVESTOR: "Investor",
  VERIFIED_DEALER: "Ověřený dealer",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const logo = await getLogoBase64();

  const user = await prisma.user.findFirst({
    where: { slug },
    select: {
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      city: true,
    },
  });

  if (!user) {
    return new ImageResponse(
      (
        <OgLayout logo={logo}>
          <div style={{ display: "flex", fontSize: 42, fontWeight: 800, color: "white" }}>
            <span>Profil na </span>
            <span style={{ color: ORANGE, marginLeft: 10 }}>CarMakléř</span>
          </div>
        </OgLayout>
      ),
      { ...size },
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  const roleLabel = ROLE_LABELS[user.role] ?? "Profil";
  const avatarSrc = user.avatar || `${BASE_URL}/brand/default-avatar.png`;

  return new ImageResponse(
    (
      <OgLayout logo={logo}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: `3px solid ${ORANGE}`,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <img
              src={avatarSrc}
              alt=""
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
          </div>

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 42,
                fontWeight: 800,
                color: "white",
                lineHeight: 1.2,
              }}
            >
              {fullName}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                color: ORANGE,
                marginTop: 8,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {roleLabel}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "rgba(255,255,255,0.6)",
                marginTop: 6,
              }}
            >
              {user.city || ""}
            </div>
          </div>
        </div>
      </OgLayout>
    ),
    { ...size },
  );
}

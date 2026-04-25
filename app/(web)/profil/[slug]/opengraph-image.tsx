import { ImageResponse } from "next/og";
import { OgLayout, OG_SIZE, getLogoBase64, ORANGE } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

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
      trustScore: true,
    },
  });

  if (!user) {
    return new ImageResponse(
      (
        <OgLayout logo={logo}>
          <div style={{ fontSize: 42, fontWeight: 800, color: "white" }}>
            Profil na <span style={{ color: ORANGE }}>CarMakléř</span>
          </div>
        </OgLayout>
      ),
      { ...size },
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  const roleLabel = ROLE_LABELS[user.role] ?? "Profil";

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
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={fullName}
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                border: `3px solid ${ORANGE}`,
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(249,115,22,0.2)",
                border: `3px solid ${ORANGE}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                fontWeight: 700,
                color: ORANGE,
              }}
            >
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
          )}

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
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
            {user.city && (
              <div
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.6)",
                  marginTop: 6,
                }}
              >
                {user.city}
              </div>
            )}
          </div>
        </div>
      </OgLayout>
    ),
    { ...size },
  );
}

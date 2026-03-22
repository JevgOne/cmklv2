import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const partner = await prisma.partner.findUnique({
      where: { slug },
    });

    if (!partner || partner.status !== "AKTIVNI_PARTNER") {
      return NextResponse.json({ error: "Partner nenalezen" }, { status: 404 });
    }

    // Return only public data
    return NextResponse.json({
      id: partner.id,
      name: partner.name,
      type: partner.type,
      slug: partner.slug,
      city: partner.city,
      region: partner.region,
      address: partner.address,
      phone: partner.phone,
      email: partner.email,
      web: partner.web,
      logo: partner.logo,
      description: partner.description,
      openingHours: partner.openingHours,
      googleRating: partner.googleRating,
      googleReviewCount: partner.googleReviewCount,
      latitude: partner.latitude,
      longitude: partner.longitude,
      createdAt: partner.createdAt,
    });
  } catch (error) {
    console.error("GET /api/partners/public/[slug] error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

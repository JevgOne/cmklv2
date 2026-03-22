import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner nenalezen" }, { status: 404 });
    }

    return NextResponse.json({
      id: partner.id,
      name: partner.name,
      description: partner.description,
      phone: partner.phone,
      email: partner.email,
      web: partner.web,
      address: partner.address,
      city: partner.city,
      logo: partner.logo,
      openingHours: partner.openingHours,
    });
  } catch (error) {
    console.error("GET /api/partner/profile error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner nenalezen" }, { status: 404 });
    }

    const body = await request.json();

    const updated = await prisma.partner.update({
      where: { id: partner.id },
      data: {
        description: body.description ?? partner.description,
        phone: body.phone ?? partner.phone,
        email: body.email ?? partner.email,
        web: body.web ?? partner.web,
        address: body.address ?? partner.address,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/partner/profile error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

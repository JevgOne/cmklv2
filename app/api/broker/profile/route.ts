import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Neprihlaseny" },
        { status: 401 }
      );
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Pristup odepren" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    const [user, totalVehicles, soldVehicles] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          bio: true,
          specializations: true,
          cities: true,
          slug: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.vehicle.count({
        where: { brokerId: userId },
      }),
      prisma.vehicle.count({
        where: { brokerId: userId, status: "SOLD" },
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: "Uzivatel nenalezen" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
      stats: { totalVehicles, soldVehicles },
    });
  } catch (error) {
    console.error("GET /api/broker/profile error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "Jmeno je povinne").max(50).optional(),
  lastName: z.string().min(1, "Prijmeni je povinne").max(50).optional(),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatar: z.string().max(500).optional().nullable(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Neprihlaseny" },
        { status: 401 }
      );
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Pristup odepren" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        bio: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatna data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PATCH /api/broker/profile error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

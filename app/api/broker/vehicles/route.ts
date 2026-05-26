import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/broker/vehicles — Všechna vozidla přihlášeného makléře    */
/* ------------------------------------------------------------------ */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen" },
        { status: 401 }
      );
    }

    const allowedRoles = ["BROKER", "MANAGER", "ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Nemáte oprávnění k tomuto zdroji" },
        { status: 403 }
      );
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { brokerId: session.user.id },
      select: {
        id: true,
        brand: true,
        model: true,
        variant: true,
        year: true,
        mileage: true,
        vin: true,
        price: true,
        condition: true,
        color: true,
        fuelType: true,
        transmission: true,
        enginePower: true,
        sellerName: true,
        sellerPhone: true,
        sellerEmail: true,
        status: true,
        viewCount: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
        _count: {
          select: { inquiries: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = vehicles.map((v) => ({
      ...v,
      primaryImage: v.images[0]?.url ?? null,
      inquiryCount: v._count.inquiries,
      images: undefined,
      _count: undefined,
    }));

    return NextResponse.json({ vehicles: formatted });
  } catch (error) {
    console.error("GET /api/broker/vehicles error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

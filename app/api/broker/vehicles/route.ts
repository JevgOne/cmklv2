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
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("GET /api/broker/vehicles error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

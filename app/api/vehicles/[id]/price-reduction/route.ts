import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

const priceReductionSchema = z.object({
  suggestedPrice: z.number().int().positive(),
  reason: z.string().min(1).max(500),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Pristup odepren" }, { status: 403 });
    }

    const { id: vehicleId } = await params;
    const body = await request.json();
    const parsed = priceReductionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatna data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, price: true, brokerId: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
    }

    if (parsed.data.suggestedPrice >= vehicle.price) {
      return NextResponse.json(
        { error: "Navrzena cena musi byt nizsi nez aktualni" },
        { status: 400 }
      );
    }

    const reduction = await prisma.priceReduction.create({
      data: {
        vehicleId,
        currentPrice: vehicle.price,
        suggestedPrice: parsed.data.suggestedPrice,
        reason: parsed.data.reason,
      },
    });

    // Create notification for broker
    if (vehicle.brokerId) {
      await prisma.notification.create({
        data: {
          userId: vehicle.brokerId,
          type: "VEHICLE",
          title: "Navrh snizeni ceny",
          body: `U vaseho vozidla byl navrzen novy cenovy navrh. Aktualni cena: ${vehicle.price} Kc, navrzena: ${parsed.data.suggestedPrice} Kc.`,
          link: `/makler/vehicles/${vehicleId}`,
        },
      });
    }

    return NextResponse.json(reduction, { status: 201 });
  } catch (error) {
    console.error("POST /api/vehicles/[id]/price-reduction error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }

    const { id: vehicleId } = await params;

    const reductions = await prisma.priceReduction.findMany({
      where: { vehicleId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reductions);
  } catch (error) {
    console.error("GET /api/vehicles/[id]/price-reduction error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reserveVehicleSchema } from "@/lib/validators/sales";

/* ------------------------------------------------------------------ */
/*  POST /api/vehicles/[id]/reserve — Rezervace vozidla                */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Načtení vozidla
    const vehicle = await prisma.vehicle.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vozidlo nenalezeno" },
        { status: 404 }
      );
    }

    // Autorizace: vlastník nebo admin
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    const isOwner = vehicle.brokerId === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Nemáte oprávnění rezervovat toto vozidlo" },
        { status: 403 }
      );
    }

    // Kontrola stavu — pouze ACTIVE vozidla lze rezervovat
    if (vehicle.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Vozidlo ve stavu "${vehicle.status}" nelze rezervovat. Povolený stav: ACTIVE` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = reserveVehicleSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      // Change log
      await tx.vehicleChangeLog.create({
        data: {
          vehicleId: vehicle.id,
          userId: session.user.id,
          field: "status",
          oldValue: vehicle.status,
          newValue: "RESERVED",
          reason: `Rezervace pro ${data.buyerName}`,
          flagged: false,
          flagReason: null,
        },
      });

      return tx.vehicle.update({
        where: { id: vehicle.id },
        data: {
          status: "RESERVED",
          reservedFor: `${data.buyerName} (${data.buyerPhone}${data.buyerEmail ? ", " + data.buyerEmail : ""})`,
          reservedAt: new Date(),
          reservedPrice: data.agreedPrice,
          handoverDate: data.handoverDate ? new Date(data.handoverDate) : null,
        },
        include: {
          images: { orderBy: { order: "asc" } },
          broker: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });
    });

    return NextResponse.json({ vehicle: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/vehicles/[id]/reserve error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

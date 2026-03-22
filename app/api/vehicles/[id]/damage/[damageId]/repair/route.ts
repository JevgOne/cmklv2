import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { repairDamageSchema } from "@/lib/validators/sales";

/* ------------------------------------------------------------------ */
/*  PUT /api/vehicles/[id]/damage/[damageId]/repair — Záznam opravy    */
/* ------------------------------------------------------------------ */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; damageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    const { id, damageId } = await params;

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
        { error: "Nemáte oprávnění upravovat poškození tohoto vozidla" },
        { status: 403 }
      );
    }

    // Načtení damage reportu
    const existing = await prisma.damageReport.findFirst({
      where: { id: damageId, vehicleId: vehicle.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Záznam o poškození nenalezen" },
        { status: 404 }
      );
    }

    if (existing.repaired) {
      return NextResponse.json(
        { error: "Toto poškození je již označeno jako opravené" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = repairDamageSchema.parse(body);

    const damageReport = await prisma.damageReport.update({
      where: { id: damageId },
      data: {
        repaired: true,
        repairedAt: new Date(),
        repairNote: data.repairNote,
      },
    });

    return NextResponse.json({ damageReport });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PUT /api/vehicles/[id]/damage/[damageId]/repair error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

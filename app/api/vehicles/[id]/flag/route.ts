import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/vehicles/[id]/flag — Nahlásit vozidlo (bez auth)         */
/* ------------------------------------------------------------------ */

const flagSchema = z.object({
  reason: z.string().min(1, "Důvod je povinný"),
  details: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = flagSchema.parse(body);

    // Ověřit, že vozidlo existuje
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vozidlo nenalezeno" }, { status: 404 });
    }

    // Zaznamenat nahlášení do changeLog
    await prisma.vehicleChangeLog.create({
      data: {
        vehicleId: id,
        userId: "anonymous",
        field: "flag",
        oldValue: null,
        newValue: data.reason,
        reason: data.details || null,
        flagReason: data.reason,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/vehicles/[id]/flag error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

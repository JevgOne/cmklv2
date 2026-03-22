import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDamageSchema } from "@/lib/validators/sales";

/* ------------------------------------------------------------------ */
/*  POST /api/vehicles/[id]/damage — Nahlášení poškození               */
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
        { error: "Nemáte oprávnění nahlásit poškození tohoto vozidla" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createDamageSchema.parse(body);

    const damageReport = await prisma.damageReport.create({
      data: {
        vehicleId: vehicle.id,
        reportedById: session.user.id,
        description: data.description,
        severity: data.severity,
        images: data.images ? JSON.stringify(data.images) : null,
      },
    });

    return NextResponse.json({ damageReport }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/vehicles/[id]/damage error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

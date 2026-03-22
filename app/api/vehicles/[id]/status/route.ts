import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  PATCH /api/vehicles/[id]/status — Změna stavu vozidla              */
/* ------------------------------------------------------------------ */

const statusChangeSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "REJECTED", "RESERVED", "SOLD"]),
  reason: z.string().optional(),
});

// Povolené přechody stavů
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING"],              // Makléř odešle ke schválení
  PENDING: ["ACTIVE", "REJECTED"], // Admin schválí nebo zamítne
  REJECTED: ["PENDING"],           // Makléř opraví a znovu odešle
  ACTIVE: ["RESERVED", "SOLD"],    // Makléř rezervuje nebo prodá
  RESERVED: ["ACTIVE", "SOLD"],    // Zrušení rezervace nebo prodej
};

// Přechody vyžadující admin roli
const ADMIN_ONLY_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ACTIVE", "REJECTED"],
};

export async function PATCH(
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
    const body = await request.json();
    const data = statusChangeSchema.parse(body);

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

    // Kontrola povoleného přechodu
    const allowedNext = ALLOWED_TRANSITIONS[vehicle.status] || [];
    if (!allowedNext.includes(data.status)) {
      return NextResponse.json(
        {
          error: `Nelze změnit stav z "${vehicle.status}" na "${data.status}". Povolené přechody: ${allowedNext.join(", ") || "žádné"}`,
        },
        { status: 400 }
      );
    }

    // Autorizace: admin-only přechody vs. vlastník/admin
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    const isOwner = vehicle.brokerId === session.user.id;
    const adminOnly = ADMIN_ONLY_TRANSITIONS[vehicle.status] || [];

    if (adminOnly.includes(data.status) && !isAdmin) {
      return NextResponse.json(
        { error: "Tento přechod stavu může provést pouze admin" },
        { status: 403 }
      );
    }

    if (!adminOnly.includes(data.status) && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Nemáte oprávnění měnit stav tohoto vozidla" },
        { status: 403 }
      );
    }

    // Zamítnutí vyžaduje důvod
    if (data.status === "REJECTED" && !data.reason) {
      return NextResponse.json(
        { error: "Při zamítnutí je vyžadován důvod (reason)" },
        { status: 400 }
      );
    }

    // Aktualizace stavu
    const updateData: Record<string, unknown> = {
      status: data.status,
    };

    // Nastavit publishedAt při aktivaci
    if (data.status === "ACTIVE" && !vehicle.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Vytvořit change log záznam
      await tx.vehicleChangeLog.create({
        data: {
          vehicleId: vehicle.id,
          userId: session.user.id,
          field: "status",
          oldValue: vehicle.status,
          newValue: data.status,
          reason: data.reason ?? null,
          flagged: false,
          flagReason: null,
        },
      });

      return tx.vehicle.update({
        where: { id: vehicle.id },
        data: updateData,
        include: {
          images: true,
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

    console.error("PATCH /api/vehicles/[id]/status error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RESERVATION_DURATION_MS = 30 * 60 * 1000; // 30 min

const reserveSchema = z.object({
  partId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  sessionId: z.string().min(1),
});

const releaseSchema = z.object({
  partId: z.string().min(1),
  sessionId: z.string().min(1),
});

/* ------------------------------------------------------------------ */
/*  POST /api/parts/reserve — Rezervace dílu na 30 min                 */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = reserveSchema.parse(body);

    const reservation = await prisma.$transaction(async (tx) => {
      const part = await tx.part.findUnique({
        where: { id: data.partId, status: "ACTIVE" },
        select: { id: true, stock: true, name: true },
      });
      if (!part) throw new Error("PART_NOT_FOUND");

      // Spočítat aktuálně rezervované kusy (neexpirované, nezaplacené, jiné session)
      const now = new Date();
      const activeReservations = await tx.partReservation.aggregate({
        where: {
          partId: data.partId,
          expiresAt: { gt: now },
          orderId: null,
          sessionId: { not: data.sessionId },
        },
        _sum: { quantity: true },
      });

      const reservedQty = activeReservations._sum.quantity ?? 0;
      const availableQty = part.stock - reservedQty;

      if (availableQty < data.quantity) {
        throw new Error("PART_RESERVED");
      }

      // Upsert — pokud session už má rezervaci, prodlouží se
      return tx.partReservation.upsert({
        where: {
          partId_sessionId: { partId: data.partId, sessionId: data.sessionId },
        },
        create: {
          partId: data.partId,
          sessionId: data.sessionId,
          quantity: data.quantity,
          expiresAt: new Date(Date.now() + RESERVATION_DURATION_MS),
        },
        update: {
          quantity: data.quantity,
          expiresAt: new Date(Date.now() + RESERVATION_DURATION_MS),
        },
      });
    });

    return NextResponse.json({ reservation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      if (error.message === "PART_NOT_FOUND") {
        return NextResponse.json({ error: "Díl nenalezen" }, { status: 404 });
      }
      if (error.message === "PART_RESERVED") {
        return NextResponse.json(
          { error: "Díl je dočasně rezervován jiným zákazníkem. Zkuste to za chvíli." },
          { status: 409 },
        );
      }
    }
    console.error("POST /api/parts/reserve error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/parts/reserve — Uvolnění rezervace                     */
/* ------------------------------------------------------------------ */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const data = releaseSchema.parse(body);

    await prisma.partReservation.deleteMany({
      where: {
        partId: data.partId,
        sessionId: data.sessionId,
        orderId: null, // jen nezaplacené
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("DELETE /api/parts/reserve error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

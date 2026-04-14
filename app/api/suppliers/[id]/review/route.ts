import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
});

/* ------------------------------------------------------------------ */
/*  POST /api/suppliers/[id]/review — Ohodnotit dodavatele              */
/* ------------------------------------------------------------------ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id: supplierId } = await params;
    const body = await request.json();
    const data = reviewSchema.parse(body);

    // Ověřit objednávku
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: { buyerId: true, status: true, items: { select: { supplierId: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Objednávka nenalezena" }, { status: 404 });
    }

    if (order.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Toto není vaše objednávka" }, { status: 403 });
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Hodnocení je možné až po doručení objednávky" },
        { status: 400 },
      );
    }

    // Ověřit že order obsahuje items od tohoto dodavatele
    const hasSupplier = order.items.some((i) => i.supplierId === supplierId);
    if (!hasSupplier) {
      return NextResponse.json(
        { error: "Tento dodavatel není součástí objednávky" },
        { status: 400 },
      );
    }

    const review = await prisma.supplierReview.create({
      data: {
        supplierId,
        buyerId: session.user.id,
        orderId: data.orderId,
        rating: data.rating,
        text: data.text ?? null,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    // Unique constraint (buyerId, orderId)
    if ((error as Record<string, string>)?.code === "P2002") {
      return NextResponse.json(
        { error: "Tuto objednávku jste již hodnotili" },
        { status: 409 },
      );
    }
    console.error("POST /api/suppliers/[id]/review error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

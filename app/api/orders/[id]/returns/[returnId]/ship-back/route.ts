import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const shipBackSchema = z.object({
  trackingNumber: z.string().min(1, "Zadejte číslo zásilky").optional(),
});

/* ------------------------------------------------------------------ */
/*  POST /api/orders/[id]/returns/[returnId]/ship-back                 */
/*  Zákazník označí reklamaci jako odeslanou zpět + tracking number    */
/* ------------------------------------------------------------------ */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; returnId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: orderId, returnId } = await params;

    // Načíst objednávku
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
    });

    if (!order) {
      return NextResponse.json({ error: "Objednávka nenalezena" }, { status: 404 });
    }

    // Přístup: vlastník objednávky nebo admin
    if (order.buyerId && session?.user?.id !== order.buyerId) {
      if (!session?.user?.role || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
        return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
      }
    }

    // Načíst return request
    const returnRecord = await prisma.returnRequest.findFirst({
      where: { id: returnId, orderId: order.id },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Reklamace nenalezena" }, { status: 404 });
    }

    // Lze odeslat zpět pouze v statusu NEW nebo APPROVED
    if (!["NEW", "APPROVED"].includes(returnRecord.status)) {
      return NextResponse.json(
        { error: "Zásilku zpět lze odeslat pouze u nové nebo schválené reklamace" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const data = shipBackSchema.parse(body);

    const updated = await prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status: "SHIPPED_BACK",
        returnTrackingNumber: data.trackingNumber ?? null,
        shippedBackAt: new Date(),
      },
    });

    return NextResponse.json({ return: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/orders/[id]/returns/[returnId]/ship-back error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

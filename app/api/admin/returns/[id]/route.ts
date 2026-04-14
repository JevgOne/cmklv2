import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";

const updateReturnSchema = z.object({
  status: z.enum([
    "NEW", "RECEIVED", "SHIPPED_BACK", "IN_REVIEW", "APPROVED",
    "REFUNDED", "PARTIALLY_REFUNDED", "REJECTED", "CANCELLED",
  ]).optional(),
  rejectionReason: z.string().optional(),
  approvedAmount: z.number().min(0).optional(),
  adminNotes: z.string().optional(),
  returnTrackingNumber: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !["ADMIN", "BACKOFFICE", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { id } = await params;
    const returnRecord = await prisma.returnRequest.findUnique({
      where: { id },
      include: { order: { include: { items: true } } },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Reklamace nenalezena" }, { status: 404 });
    }

    return NextResponse.json({ return: returnRecord });
  } catch (error) {
    console.error("GET /api/admin/returns/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateReturnSchema.parse(body);

    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      select: {
        id: true, orderId: true, status: true,
        requestedAmount: true, approvedAmount: true,
        adminNotes: true, rejectionReason: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Reklamace nenalezena" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (data.status) {
      updateData.status = data.status;
      // Automaticky nastavit shippedBackAt při SHIPPED_BACK
      if (data.status === "SHIPPED_BACK") {
        updateData.shippedBackAt = new Date();
      }
      // Automaticky nastavit refundedAt při refundaci
      if (data.status === "REFUNDED" || data.status === "PARTIALLY_REFUNDED") {
        updateData.refundedAt = new Date();

        // Stripe refund — pokud platba byla kartou přes Stripe
        const order = await prisma.order.findUnique({
          where: { id: existing.orderId },
          select: { paymentMethod: true, stripePaymentIntentId: true },
        });

        if (order?.paymentMethod === "CARD" && order.stripePaymentIntentId) {
          const refundAmount = data.approvedAmount ?? existing.approvedAmount ?? existing.requestedAmount;
          try {
            const stripe = getStripe();
            await stripe.refunds.create({
              payment_intent: order.stripePaymentIntentId,
              amount: refundAmount, // v haléřích (CZK minor units)
            });
          } catch (stripeErr) {
            console.error(`Stripe refund failed for return ${id}:`, stripeErr);
            // Graceful fallback — přidáme poznámku, ale pokračujeme
            updateData.adminNotes =
              (data.adminNotes ?? existing.adminNotes ?? "") +
              `\n[AUTO] Stripe refund selhal — vyřešte manuálně.`;
          }
        }
      }
    }
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
    if (data.approvedAmount !== undefined) updateData.approvedAmount = data.approvedAmount;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;
    if (data.returnTrackingNumber !== undefined) updateData.returnTrackingNumber = data.returnTrackingNumber;

    const updated = await prisma.returnRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ return: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("PUT /api/admin/returns/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

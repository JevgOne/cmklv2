import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aggregateOrderStatus } from "@/lib/orders/utils";
import { z } from "zod";

const trackingSchema = z.object({
  trackingNumber: z.string().min(1),
  trackingCarrier: z.string().optional(),
  trackingUrl: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = trackingSchema.parse(body);

    const subOrder = await prisma.subOrder.findUnique({ where: { id } });
    if (!subOrder) {
      return NextResponse.json({ error: "SubOrder nenalezen" }, { status: 404 });
    }

    // Auth: supplier owns this SubOrder OR admin/backoffice
    const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);
    if (!isAdmin && subOrder.supplierId !== session.user.id) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    // Update tracking + auto-set SHIPPED
    const updateData: Record<string, unknown> = {
      trackingNumber: data.trackingNumber,
      trackingCarrier: data.trackingCarrier ?? subOrder.deliveryMethod,
      trackingUrl: data.trackingUrl ?? null,
    };

    if (subOrder.status === "PENDING" || subOrder.status === "CONFIRMED") {
      updateData.status = "SHIPPED";
      updateData.shippedAt = new Date();
    }

    await prisma.subOrder.update({ where: { id }, data: updateData });

    // Aggregate Order status from DB (already reflects the update above)
    const allSubOrders = await prisma.subOrder.findMany({
      where: { orderId: subOrder.orderId },
      select: { status: true },
    });
    const orderStatus = aggregateOrderStatus(allSubOrders);
    await prisma.order.update({
      where: { id: subOrder.orderId },
      data: { status: orderStatus },
    });

    return NextResponse.json({ success: true, trackingNumber: data.trackingNumber });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("PUT /api/suborders/[id]/tracking error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

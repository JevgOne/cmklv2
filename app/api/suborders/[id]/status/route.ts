import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

const STATUS_PRIORITY = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

function aggregateOrderStatus(subOrders: { status: string }[]): string {
  const active = subOrders.filter((s) => s.status !== "CANCELLED");
  if (active.length === 0) return "CANCELLED";
  const worst = Math.min(
    ...active.map((s) => {
      const idx = STATUS_PRIORITY.indexOf(s.status);
      return idx === -1 ? 0 : idx;
    }),
  );
  return STATUS_PRIORITY[worst] || "PENDING";
}

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
    const data = statusSchema.parse(body);

    const subOrder = await prisma.subOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!subOrder) {
      return NextResponse.json({ error: "SubOrder nenalezen" }, { status: 404 });
    }

    // Auth: supplier owns this SubOrder OR admin/backoffice
    const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);
    if (!isAdmin && subOrder.supplierId !== session.user.id) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = { status: data.status };
    if (data.status === "SHIPPED" && !subOrder.shippedAt) {
      updateData.shippedAt = new Date();
    }
    if (data.status === "DELIVERED" && !subOrder.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    // Update SubOrder
    await prisma.subOrder.update({ where: { id }, data: updateData });

    // If CANCELLED, restore stock
    if (data.status === "CANCELLED") {
      for (const item of subOrder.items) {
        await prisma.part.update({
          where: { id: item.partId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    // Aggregate Order status from all SubOrders
    const allSubOrders = await prisma.subOrder.findMany({
      where: { orderId: subOrder.orderId },
      select: { status: true },
    });
    const orderStatus = aggregateOrderStatus(allSubOrders);
    await prisma.order.update({
      where: { id: subOrder.orderId },
      data: { status: orderStatus },
    });

    return NextResponse.json({ success: true, status: data.status, orderStatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("PUT /api/suborders/[id]/status error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

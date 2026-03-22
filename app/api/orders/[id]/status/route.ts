import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderStatusSchema } from "@/lib/validators/parts";

/* ------------------------------------------------------------------ */
/*  PUT /api/orders/[id]/status — Změna stavu objednávky                */
/* ------------------------------------------------------------------ */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = orderStatusSchema.parse(body);

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: { select: { supplierId: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Objednávka nenalezena" }, { status: 404 });
    }

    // Ověřit oprávnění: dodavatel položek nebo admin
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    const isSupplier = existing.items.some((i) => i.supplierId === session.user.id);

    if (!isSupplier && !isAdmin) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status: data.status };

    if (data.status === "SHIPPED") {
      updateData.shippedAt = new Date();
      if (data.trackingNumber) {
        updateData.trackingNumber = data.trackingNumber;
      }
    }

    if (data.status === "DELIVERED") {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = "PAID";
    }

    if (data.status === "CANCELLED") {
      // Vrátit stock
      const items = await prisma.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        await prisma.part.update({
          where: { id: item.partId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            part: { select: { name: true, slug: true } },
          },
        },
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("PUT /api/orders/[id]/status error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

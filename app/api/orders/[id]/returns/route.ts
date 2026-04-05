import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReturnSchema } from "@/lib/validators/return";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: orderId } = await params;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Objednávka nenalezena" }, { status: 404 });
    }

    // Přístup: přihlášený vlastník nebo admin
    if (order.buyerId && session?.user?.id !== order.buyerId) {
      if (!session?.user?.role || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
        return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
      }
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Vrácení/reklamaci lze podat pouze u doručené objednávky" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = createReturnSchema.parse(body);

    // 14-den lhůta pro WITHDRAWAL
    if (data.type === "WITHDRAWAL" && order.deliveredAt) {
      const daysSince = Math.floor(
        (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince > 14) {
        return NextResponse.json(
          { error: "Lhůta 14 dní pro odstoupení od smlouvy již uplynula" },
          { status: 400 }
        );
      }
    }

    // Ověřit položky
    const orderItemIds = new Set(order.items.map((i) => i.id));
    for (const item of data.items) {
      if (!orderItemIds.has(item.orderItemId)) {
        return NextResponse.json(
          { error: `Položka ${item.orderItemId} nepatří k této objednávce` },
          { status: 400 }
        );
      }
    }

    // Spočítat částku
    let requestedAmount = 0;
    for (const item of data.items) {
      const orderItem = order.items.find((i) => i.id === item.orderItemId)!;
      requestedAmount += orderItem.unitPrice * item.quantity;
    }

    const deadlineAt = new Date();
    deadlineAt.setDate(deadlineAt.getDate() + 30);

    const returnRecord = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        type: data.type,
        items: JSON.stringify(data.items),
        reason: data.reason,
        defectDesc: data.defectDesc ?? null,
        photos: data.photos ? JSON.stringify(data.photos) : null,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone ?? null,
        bankAccount: data.bankAccount ?? null,
        requestedAmount,
        status: "NEW",
        deadlineAt,
      },
    });

    return NextResponse.json({ return: returnRecord }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Neplatná data", details: error }, { status: 400 });
    }
    console.error("POST /api/orders/[id]/returns error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: orderId } = await params;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
    });

    if (!order) {
      return NextResponse.json({ error: "Objednávka nenalezena" }, { status: 404 });
    }

    if (order.buyerId && session?.user?.id !== order.buyerId) {
      if (!session?.user?.role || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
        return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
      }
    }

    const returns = await prisma.returnRequest.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ returns });
  } catch (error) {
    console.error("GET /api/orders/[id]/returns error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

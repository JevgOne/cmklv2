import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const status = params.get("status") || "";
    const search = params.get("search") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { deliveryName: { contains: search, mode: "insensitive" } },
        { deliveryEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { select: { id: true, quantity: true, unitPrice: true, part: { select: { name: true } } } },
        buyer: { select: { firstName: true, lastName: true, email: true } },
        subOrders: {
          select: {
            id: true,
            status: true,
            deliveryMethod: true,
            subtotal: true,
            trackingNumber: true,
            supplierId: true,
            supplier: { select: { companyName: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: "Chybí orderId nebo status" }, { status: 400 });
    }

    const validStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Neplatný status" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("PATCH /api/admin/orders error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

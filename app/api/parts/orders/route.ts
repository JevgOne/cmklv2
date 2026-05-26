import { NextRequest, NextResponse } from "next/server";
import { getSessionOrMobileToken } from "@/lib/auth-mobile";
import { prisma } from "@/lib/prisma";

const SUPPLIER_ROLES = [
  "PARTS_SUPPLIER",
  "WHOLESALE_SUPPLIER",
  "PARTNER_VRAKOVISTE",
  "ADMIN",
  "BACKOFFICE",
];

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrMobileToken(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }
    if (!SUPPLIER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const status = params.get("status");
    const page = Math.max(1, parseInt(params.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "20")));

    const where: Record<string, unknown> = {
      supplierId: session.user.id,
    };

    if (status && ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)) {
      where.status = status;
    }

    const [subOrders, total] = await Promise.all([
      prisma.subOrder.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              deliveryName: true,
              deliveryPhone: true,
              deliveryEmail: true,
              deliveryAddress: true,
              deliveryCity: true,
              deliveryZip: true,
              paymentMethod: true,
              paymentStatus: true,
              shippingPrice: true,
              note: true,
              createdAt: true,
            },
          },
          items: {
            include: {
              part: {
                select: {
                  id: true,
                  name: true,
                  images: { where: { isPrimary: true }, take: 1, select: { url: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subOrder.count({ where }),
    ]);

    return NextResponse.json({
      orders: subOrders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/parts/orders error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

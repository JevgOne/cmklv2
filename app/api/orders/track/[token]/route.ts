import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/orders/track/[token] — Sledovani objednavky pres guest token.
 * Nevyzaduje prihlaseni — pristup pres unikatni token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 32) {
      return NextResponse.json({ error: "Neplatny token" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { guestToken: token },
      include: {
        subOrders: {
          include: {
            supplier: { select: { companyName: true, firstName: true, lastName: true } },
            items: {
              include: {
                part: {
                  select: {
                    name: true,
                    slug: true,
                    images: { where: { isPrimary: true }, take: 1 },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        items: {
          include: {
            part: {
              select: {
                name: true,
                slug: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Objednavka nenalezena" }, { status: 404 });
    }

    // Vracet jen bezpecna data (ne interni poznamky, supplier info)
    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalPrice: order.totalPrice,
        shippingPrice: order.shippingPrice,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber,
        deliveryMethod: order.deliveryMethod,
        zasilkovnaPointName: order.zasilkovnaPointName,
        deliveryName: order.deliveryName,
        createdAt: order.createdAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        items: order.items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          part: i.part,
        })),
        subOrders: order.subOrders.map((so) => ({
          id: so.id,
          status: so.status,
          deliveryMethod: so.deliveryMethod,
          zasilkovnaPointName: so.zasilkovnaPointName,
          trackingNumber: so.trackingNumber,
          shippedAt: so.shippedAt,
          deliveredAt: so.deliveredAt,
          subtotal: so.subtotal,
          shippingPrice: so.shippingPrice,
          supplierName: so.supplier.companyName ?? `${so.supplier.firstName} ${so.supplier.lastName}`,
          items: so.items.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            part: i.part,
          })),
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/orders/track/[token] error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}

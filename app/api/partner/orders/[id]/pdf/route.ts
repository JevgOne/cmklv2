import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDeliveryNote, generateOrderConfirmation } from "@/lib/pdf/partner-documents";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE", "PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "ADMIN", "BACKOFFICE"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;
    const type = request.nextUrl.searchParams.get("type") || "delivery";

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            part: { select: { name: true, slug: true } },
          },
        },
        buyer: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Objednavka nenalezena" }, { status: 404 });
    }

    // Verify: supplier owns at least one item in this order
    const supplierItems = order.items.filter(item => item.supplierId === session.user.id);
    const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);
    if (supplierItems.length === 0 && !isAdmin) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    // Load partner profile for supplier info
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: { name: true, ico: true, address: true, city: true, phone: true, email: true },
    });

    const supplierInfo = {
      name: partner?.name || "Dodavatel",
      ico: partner?.ico,
      address: [partner?.address, partner?.city].filter(Boolean).join(", ") || null,
      phone: partner?.phone,
      email: partner?.email,
    };

    const buyerInfo = {
      name: order.deliveryName,
      email: order.deliveryEmail,
      phone: order.deliveryPhone,
      address: [order.deliveryAddress, order.deliveryCity, order.deliveryZip].filter(Boolean).join(", ") || null,
    };

    const items = (isAdmin ? order.items : supplierItems).map(item => ({
      name: item.part.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    const itemsTotal = items.reduce((s, i) => s + i.totalPrice, 0);
    const createdAt = new Date(order.createdAt).toLocaleDateString("cs-CZ", {
      day: "numeric", month: "long", year: "numeric",
    });

    const commonData = {
      orderNumber: order.orderNumber,
      date: createdAt,
      supplier: supplierInfo,
      buyer: buyerInfo,
      items,
      totalPrice: isAdmin ? order.totalPrice : itemsTotal + (isAdmin ? order.shippingPrice : 0),
      shippingPrice: order.shippingPrice,
      deliveryMethod: order.deliveryMethod,
      note: order.note,
    };

    const pdfBuffer = type === "confirmation"
      ? generateOrderConfirmation({
          ...commonData,
          paymentMethod: order.paymentMethod,
          trackingNumber: order.trackingNumber,
        })
      : generateDeliveryNote(commonData);

    const filename = type === "confirmation"
      ? `potvrzeni-${order.orderNumber}.pdf`
      : `dodaci-list-${order.orderNumber}.pdf`;

    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("POST /api/partner/orders/[id]/pdf error:", error);
    return NextResponse.json({ error: "Chyba pri generovani PDF" }, { status: 500 });
  }
}

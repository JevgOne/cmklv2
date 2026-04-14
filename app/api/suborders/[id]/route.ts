import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;

    const subOrder = await prisma.subOrder.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            orderNumber: true,
            deliveryName: true,
            deliveryPhone: true,
            deliveryEmail: true,
            deliveryAddress: true,
            deliveryCity: true,
            deliveryZip: true,
            paymentMethod: true,
            paymentStatus: true,
            note: true,
            buyerId: true,
            buyer: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
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

    if (!subOrder) {
      return NextResponse.json({ error: "SubOrder nenalezen" }, { status: 404 });
    }

    // Auth: supplier owns this SubOrder OR admin/backoffice OR buyer
    const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);
    const isSupplier = subOrder.supplierId === session.user.id;
    const isBuyer = subOrder.order.buyerId === session.user.id;

    if (!isAdmin && !isSupplier && !isBuyer) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    return NextResponse.json({ subOrder });
  } catch (error) {
    console.error("GET /api/suborders/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

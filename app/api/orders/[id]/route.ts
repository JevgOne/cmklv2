import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/orders/[id] — Detail objednávky                           */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const token = request.nextUrl.searchParams.get("token");
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        items: {
          include: {
            part: {
              select: {
                name: true,
                slug: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            supplier: {
              select: { id: true, firstName: true, lastName: true, companyName: true },
            },
          },
        },
        buyer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Objednávka nenalezena" }, { status: 404 });
    }

    // Ověřit přístup: kupující, dodavatel položek, admin, nebo guest s tokenem
    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "BACKOFFICE";
    const isBuyer = session?.user?.id && order.buyerId === session.user.id;
    const isSupplier = session?.user?.id && order.items.some((i) => i.supplierId === session.user.id);
    const isGuest = token && order.guestToken && token === order.guestToken;

    if (!isBuyer && !isSupplier && !isAdmin && !isGuest) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
      }
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

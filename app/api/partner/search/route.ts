import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE", "PARTS_SUPPLIER", "WHOLESALE_SUPPLIER"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const q = new URL(request.url).searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ vehicles: [], parts: [], leads: [], orders: [] });
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
    });

    if (session.user.role === "PARTNER_BAZAR") {
      const [vehicles, leads] = await Promise.all([
        prisma.vehicle.findMany({
          where: {
            brokerId: session.user.id,
            OR: [
              { brand: { contains: q, mode: "insensitive" } },
              { model: { contains: q, mode: "insensitive" } },
              { vin: { contains: q } },
            ],
          },
          select: { id: true, brand: true, model: true, year: true, price: true, status: true },
          take: 10,
        }),
        partner ? prisma.partnerLead.findMany({
          where: {
            partnerId: partner.id,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, phone: true, status: true },
          take: 5,
        }) : [],
      ]);

      return NextResponse.json({ vehicles, leads });
    } else {
      // PARTNER_VRAKOVISTE / PARTS_SUPPLIER / WHOLESALE_SUPPLIER
      const [parts, orders] = await Promise.all([
        prisma.part.findMany({
          where: {
            supplierId: session.user.id,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { oemNumber: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, category: true, price: true, status: true, slug: true },
          take: 10,
        }),
        prisma.order.findMany({
          where: {
            items: { some: { supplierId: session.user.id } },
            orderNumber: { contains: q },
          },
          select: { id: true, orderNumber: true, status: true, totalPrice: true },
          take: 5,
        }),
      ]);

      return NextResponse.json({ parts, orders });
    }
  } catch (error) {
    console.error("GET /api/partner/search error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

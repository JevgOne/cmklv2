import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validators/parts";

/* ------------------------------------------------------------------ */
/*  POST /api/orders — Vytvoření objednávky z košíku                    */
/* ------------------------------------------------------------------ */

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `OBJ-${y}${m}${d}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const buyerId = session?.user?.id ?? null;

    const body = await request.json();
    const data = createOrderSchema.parse(body);

    // Načíst díly a ověřit dostupnost
    const partIds = data.items.map((i) => i.partId);
    const parts = await prisma.part.findMany({
      where: { id: { in: partIds }, status: "ACTIVE" },
    });

    if (parts.length !== partIds.length) {
      const foundIds = new Set(parts.map((p) => p.id));
      const missing = partIds.filter((id) => !foundIds.has(id));
      return NextResponse.json(
        { error: "Některé díly nejsou dostupné", missing },
        { status: 400 }
      );
    }

    // Ověřit skladem
    for (const item of data.items) {
      const part = parts.find((p) => p.id === item.partId)!;
      if (part.stock < item.quantity) {
        return NextResponse.json(
          { error: `Díl "${part.name}" nemá dostatek kusů skladem (dostupné: ${part.stock})` },
          { status: 400 }
        );
      }
    }

    // Spočítat celkovou cenu
    let totalPrice = 0;
    const orderItems = data.items.map((item) => {
      const part = parts.find((p) => p.id === item.partId)!;
      const itemTotal = part.price * item.quantity;
      totalPrice += itemTotal;
      return {
        partId: item.partId,
        supplierId: part.supplierId,
        quantity: item.quantity,
        unitPrice: part.price,
        totalPrice: itemTotal,
      };
    });

    const shippingPrice = data.paymentMethod === "COD" ? 49 : 0;
    totalPrice += shippingPrice;

    // Vytvořit objednávku + snížit stock v transakci (prevence race condition)
    const order = await prisma.$transaction(async (tx) => {
      // Znovu ověřit stock uvnitř transakce
      for (const item of data.items) {
        const part = await tx.part.findUnique({
          where: { id: item.partId },
          select: { stock: true, name: true },
        });
        if (!part || part.stock < item.quantity) {
          throw new Error(`Díl "${part?.name ?? item.partId}" nemá dostatek kusů skladem`);
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          buyerId,
          status: "PENDING",
          deliveryName: data.deliveryName,
          deliveryPhone: data.deliveryPhone,
          deliveryEmail: data.deliveryEmail,
          deliveryAddress: data.deliveryAddress,
          deliveryCity: data.deliveryCity,
          deliveryZip: data.deliveryZip,
          paymentMethod: data.paymentMethod,
          paymentStatus: "PENDING",
          totalPrice,
          shippingPrice,
          note: data.note ?? null,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: { part: { select: { name: true, slug: true } } },
          },
        },
      });

      // Snížit stock
      for (const item of data.items) {
        await tx.part.update({
          where: { id: item.partId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/orders — Seznam objednávek (kupující/dodavatel)            */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const role = params.get("role"); // "buyer" nebo "supplier"
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(params.get("limit") || "20", 10));
    const skip = (page - 1) * limit;

    let where: Record<string, unknown>;

    if (role === "supplier") {
      // Dodavatel vidí objednávky s jeho díly
      where = { items: { some: { supplierId: session.user.id } } };
    } else {
      // Kupující vidí své objednávky
      where = { buyerId: session.user.id };
    }

    const statusFilter = params.get("status");
    if (statusFilter) {
      where.status = statusFilter;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              part: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

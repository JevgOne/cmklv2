import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validators/parts";
import { getStripe } from "@/lib/stripe";
import { getShippingPrice } from "@/lib/shipping/prices";
import type { DeliveryMethod } from "@/lib/shipping/types";

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

interface SupplierGroup {
  supplierId: string;
  items: { partId: string; supplierId: string; quantity: number; unitPrice: number; totalPrice: number }[];
  subtotal: number;
  delivery: {
    deliveryMethod: DeliveryMethod;
    zasilkovnaPointId?: string;
    zasilkovnaPointName?: string;
  };
  shippingPrice: number;
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

    // Spočítat items s cenami
    const orderItems = data.items.map((item) => {
      const part = parts.find((p) => p.id === item.partId)!;
      const itemTotal = part.price * item.quantity;
      return {
        partId: item.partId,
        supplierId: part.supplierId,
        quantity: item.quantity,
        unitPrice: part.price,
        totalPrice: itemTotal,
      };
    });

    // Backward compat: starý formát (deliveryMethod na root) → vytvořit deliveries[]
    let deliveries = data.deliveries;
    if (!deliveries || deliveries.length === 0) {
      if (!data.deliveryMethod) {
        return NextResponse.json(
          { error: "Musíte zvolit způsob doručení" },
          { status: 400 }
        );
      }
      const uniqueSupplierIds = [...new Set(parts.map((p) => p.supplierId))];
      deliveries = uniqueSupplierIds.map((sid) => ({
        supplierId: sid,
        deliveryMethod: data.deliveryMethod!,
        zasilkovnaPointId: data.zasilkovnaPointId,
        zasilkovnaPointName: data.zasilkovnaPointName,
      }));
    }

    // Seskupit items per supplierId + přiřadit delivery
    const groupMap = new Map<string, SupplierGroup>();
    for (const item of orderItems) {
      let group = groupMap.get(item.supplierId);
      if (!group) {
        const del = deliveries.find((d) => d.supplierId === item.supplierId);
        const method = (del?.deliveryMethod ?? data.deliveryMethod ?? "ZASILKOVNA") as DeliveryMethod;
        group = {
          supplierId: item.supplierId,
          items: [],
          subtotal: 0,
          delivery: {
            deliveryMethod: method,
            zasilkovnaPointId: del?.zasilkovnaPointId ?? undefined,
            zasilkovnaPointName: del?.zasilkovnaPointName ?? undefined,
          },
          shippingPrice: getShippingPrice(method),
        };
        groupMap.set(item.supplierId, group);
      }
      group.items.push(item);
      group.subtotal += item.totalPrice;
    }
    const supplierGroups = Array.from(groupMap.values());

    // Celková cena = sum subtotals + sum shipping + COD fee
    const codFee = data.paymentMethod === "COD" ? 39 : 0;
    const totalShippingPrice = supplierGroups.reduce((s, g) => s + g.shippingPrice, 0) + codFee;
    const totalPrice = supplierGroups.reduce((s, g) => s + g.subtotal, 0) + totalShippingPrice;

    // Generovat guest token pokud neni prihlaseny
    const isGuest = !buyerId;
    const guestToken = isGuest ? crypto.randomBytes(32).toString("hex") : null;

    // Vytvořit objednávku + SubOrders + snížit stock v transakci
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

      // 1. Vytvořit Order (bez nested items — ty přidáme přes SubOrders)
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          buyerId,
          guestToken,
          status: "PENDING",
          deliveryName: data.deliveryName,
          deliveryPhone: data.deliveryPhone,
          deliveryEmail: data.deliveryEmail,
          deliveryAddress: data.deliveryAddress,
          deliveryCity: data.deliveryCity,
          deliveryZip: data.deliveryZip,
          deliveryMethod: supplierGroups[0].delivery.deliveryMethod, // primary pro zpětnou komp.
          zasilkovnaPointId: supplierGroups[0].delivery.zasilkovnaPointId ?? null,
          zasilkovnaPointName: supplierGroups[0].delivery.zasilkovnaPointName ?? null,
          paymentMethod: data.paymentMethod,
          paymentStatus: "PENDING",
          totalPrice,
          shippingPrice: totalShippingPrice,
          note: data.note ?? null,
        },
      });

      // 2. Vytvořit SubOrders + OrderItems sekvenciálně (Prisma circular ref workaround)
      for (const group of supplierGroups) {
        const subOrder = await tx.subOrder.create({
          data: {
            orderId: created.id,
            supplierId: group.supplierId,
            status: "PENDING",
            deliveryMethod: group.delivery.deliveryMethod,
            deliveryPrice: group.shippingPrice,
            zasilkovnaPointId: group.delivery.zasilkovnaPointId ?? null,
            zasilkovnaPointName: group.delivery.zasilkovnaPointName ?? null,
            subtotal: group.subtotal,
            shippingPrice: group.shippingPrice,
          },
        });

        await tx.orderItem.createMany({
          data: group.items.map((item) => ({
            orderId: created.id,
            subOrderId: subOrder.id,
            partId: item.partId,
            supplierId: item.supplierId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        });
      }

      // 3. Snížit stock
      for (const item of data.items) {
        await tx.part.update({
          where: { id: item.partId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 4. Načíst kompletní Order s relacemi
      return tx.order.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          subOrders: { include: { items: true } },
          items: {
            include: { part: { select: { name: true, slug: true } } },
          },
        },
      });
    });

    // Kartová platba — vytvořit Stripe Checkout Session
    if (data.paymentMethod === "CARD") {
      try {
        const stripe = getStripe();
        const checkoutSession = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: orderItems.map((item) => {
            const part = parts.find((p) => p.id === item.partId)!;
            return {
              price_data: {
                currency: "czk",
                product_data: { name: part.name },
                unit_amount: item.unitPrice * 100, // v haléřích
              },
              quantity: item.quantity,
            };
          }),
          ...(totalShippingPrice > 0 && {
            shipping_options: [{
              shipping_rate_data: {
                display_name: `Doprava${codFee > 0 ? " + dobírka" : ""}`,
                type: "fixed_amount" as const,
                fixed_amount: { amount: totalShippingPrice * 100, currency: "czk" },
              },
            }],
          }),
          metadata: { orderId: order.id },
          customer_email: data.deliveryEmail,
          success_url: `${process.env.NEXTAUTH_URL}/shop/objednavka/potvrzeni?order=${order.orderNumber}${guestToken ? `&tracking=${encodeURIComponent(`/shop/objednavky/sledovani/${guestToken}`)}` : ""}`,
          cancel_url: `${process.env.NEXTAUTH_URL}/shop/kosik`,
        });

        return NextResponse.json({
          order,
          checkoutUrl: checkoutSession.url,
          ...(guestToken && { trackingUrl: `/shop/objednavky/sledovani/${guestToken}` }),
        }, { status: 201 });
      } catch (stripeError) {
        console.error("Stripe checkout error:", stripeError);
        return NextResponse.json({
          order,
          error: "Kartová platba není momentálně dostupná. Objednávka byla vytvořena — kontaktujte nás.",
          ...(guestToken && { trackingUrl: `/shop/objednavky/sledovani/${guestToken}` }),
        }, { status: 201 });
      }
    }

    return NextResponse.json({
      order,
      ...(guestToken && { trackingUrl: `/shop/objednavky/sledovani/${guestToken}` }),
    }, { status: 201 });
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

    if (role === "supplier") {
      // Dodavatel vidí své SubOrders (ne celé Orders)
      const subWhere: Record<string, unknown> = { supplierId: session.user.id };
      const statusFilter = params.get("status");
      if (statusFilter) subWhere.status = statusFilter;

      const [subOrders, total] = await Promise.all([
        prisma.subOrder.findMany({
          where: subWhere,
          include: {
            order: {
              select: {
                orderNumber: true, deliveryName: true, deliveryEmail: true,
                deliveryPhone: true, deliveryAddress: true, deliveryCity: true,
                deliveryZip: true, paymentMethod: true, paymentStatus: true,
              },
            },
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
        prisma.subOrder.count({ where: subWhere }),
      ]);

      return NextResponse.json({
        subOrders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Kupující vidí své objednávky
    const where: Record<string, unknown> = { buyerId: session.user.id };
    const statusFilter = params.get("status");
    if (statusFilter) where.status = statusFilter;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          subOrders: {
            include: {
              items: {
                include: {
                  part: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
                },
              },
            },
          },
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

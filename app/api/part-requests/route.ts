import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createRequestSchema = z.object({
  description: z.string().min(3, "Popis musí mít alespoň 3 znaky"),
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.number().int().min(1900).max(2100).optional(),
  vin: z.string().max(17).optional(),
  buyerEmail: z.string().email("Neplatný email"),
  buyerPhone: z.string().optional(),
  buyerName: z.string().optional(),
});

const SUPPLIER_ROLES = ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE", "ADMIN", "BACKOFFICE"];

/* ------------------------------------------------------------------ */
/*  POST /api/part-requests — Vytvořit poptávku dílu                   */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const buyerId = session?.user?.id ?? null;

    const body = await request.json();
    const data = createRequestSchema.parse(body);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const partRequest = await prisma.partRequest.create({
      data: {
        description: data.description,
        vehicleBrand: data.vehicleBrand ?? null,
        vehicleModel: data.vehicleModel ?? null,
        vehicleYear: data.vehicleYear ?? null,
        vin: data.vin ?? null,
        buyerEmail: data.buyerEmail,
        buyerPhone: data.buyerPhone ?? null,
        buyerName: data.buyerName ?? null,
        buyerId,
        expiresAt,
      },
    });

    return NextResponse.json({ request: partRequest }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/part-requests error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/part-requests — Seznam poptávek (pro dodavatele)          */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const isSupplier = SUPPLIER_ROLES.includes(session.user.role);
    const params = request.nextUrl.searchParams;
    const status = params.get("status");
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(params.get("limit") || "20", 10));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (isSupplier) {
      // Dodavatel vidí jen OPEN/OFFERS_RECEIVED neexpirované
      where.status = status ? status : { in: ["OPEN", "OFFERS_RECEIVED"] };
      where.expiresAt = { gt: new Date() };
    } else {
      // Zákazník vidí jen své poptávky
      where.buyerId = session.user.id;
      if (status) where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.partRequest.findMany({
        where,
        include: {
          offers: {
            select: {
              id: true,
              partName: true,
              price: true,
              condition: true,
              status: true,
              supplier: { select: { companyName: true, firstName: true, lastName: true } },
              createdAt: true,
            },
          },
          _count: { select: { offers: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.partRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/part-requests error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

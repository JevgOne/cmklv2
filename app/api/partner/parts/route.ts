import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "PARTNER_VRAKOVISTE") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const where: Record<string, unknown> = {
      supplierId: session.user.id,
    };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.part.count({ where }),
    ]);

    return NextResponse.json({
      parts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/partner/parts error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "PARTNER_VRAKOVISTE") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const body = await request.json();

    const part = await prisma.part.create({
      data: {
        name: body.name,
        slug: body.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36).slice(-4),
        category: body.category || "OTHER",
        compatibleBrands: body.brand ? JSON.stringify([body.brand]) : null,
        compatibleModels: body.model ? JSON.stringify([body.model]) : null,
        compatibleYearFrom: body.yearFrom || null,
        compatibleYearTo: body.yearTo || null,
        condition: body.condition || "USED_GOOD",
        price: body.price,
        description: body.description || null,
        oemNumber: body.oemNumber || null,
        stock: body.quantity || 1,
        supplierId: session.user.id,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error("POST /api/partner/parts error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

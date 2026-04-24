import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }
    if (!SUPPLIER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const status = params.get("status");
    const page = Math.max(1, parseInt(params.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "50")));

    const where: Record<string, unknown> = {
      supplierId: session.user.id,
    };

    if (["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
      const targetSupplier = params.get("supplierId");
      if (targetSupplier) where.supplierId = targetSupplier;
      else delete where.supplierId;
    }

    if (status && ["ACTIVE", "INACTIVE", "SOLD"].includes(status)) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const baseWhere = { ...where };
    delete baseWhere.status;

    const [parts, total, activeCount, inactiveCount, soldCount] = await Promise.all([
      prisma.part.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          price: true,
          stock: true,
          status: true,
          viewCount: true,
          createdAt: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.part.count({ where }),
      prisma.part.count({ where: { ...baseWhere, status: "ACTIVE" } }),
      prisma.part.count({ where: { ...baseWhere, status: "INACTIVE" } }),
      prisma.part.count({ where: { ...baseWhere, status: "SOLD" } }),
    ]);

    return NextResponse.json({
      parts: parts.map((p) => ({
        ...p,
        image: p.images[0]?.url ?? null,
        images: undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      counts: {
        all: activeCount + inactiveCount + soldCount,
        ACTIVE: activeCount,
        INACTIVE: inactiveCount,
        SOLD: soldCount,
      },
    });
  } catch (error) {
    console.error("GET /api/parts/my error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

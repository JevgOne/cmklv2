import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SUPPLIER_ROLES = ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.role ||
      !["ADMIN", "BACKOFFICE", "MANAGER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {
      role: { in: role && SUPPLIER_ROLES.includes(role) ? [role] : SUPPLIER_ROLES },
    };

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              suppliedParts: true,
              orderItemsAsSupplier: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Aggregate supplier payouts per supplier
    const supplierIds = suppliers.map((s) => s.id);
    const payoutAggregations = supplierIds.length > 0
      ? await prisma.orderItem.groupBy({
          by: ["supplierId"],
          where: { supplierId: { in: supplierIds } },
          _sum: { supplierPayout: true },
        })
      : [];

    const payoutMap = new Map(
      payoutAggregations.map((a) => [a.supplierId, a._sum.supplierPayout ?? 0])
    );

    const suppliersWithPayout = suppliers.map((s) => ({
      ...s,
      totalPayout: payoutMap.get(s.id) ?? 0,
    }));

    // Stats for header
    const [totalSuppliers, activeSuppliers, totalParts, activeParts] = await Promise.all([
      prisma.user.count({ where: { role: { in: SUPPLIER_ROLES } } }),
      prisma.user.count({ where: { role: { in: SUPPLIER_ROLES }, status: "ACTIVE" } }),
      prisma.part.count({ where: { supplier: { role: { in: SUPPLIER_ROLES } } } }),
      prisma.part.count({ where: { supplier: { role: { in: SUPPLIER_ROLES } }, status: "ACTIVE" } }),
    ]);

    return NextResponse.json({
      suppliers: suppliersWithPayout,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: { totalSuppliers, activeSuppliers, totalParts, activeParts },
    });
  } catch (error) {
    console.error("GET /api/admin/suppliers error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

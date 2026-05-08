import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminSuppliersContent } from "@/components/admin/AdminSuppliersContent";

export const metadata: Metadata = {
  title: "Dodavatele | Carmakler Admin",
  description: "Sprava dodavatelu dilu.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];
const SUPPLIER_ROLES = ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE"];

export default async function AdminSuppliersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const limit = 20;
  const where = { role: { in: SUPPLIER_ROLES } };

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
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const supplierIds = suppliers.map((s) => s.id);
  const payoutAggregations = supplierIds.length > 0
    ? await prisma.orderItem.groupBy({
        by: ["supplierId"],
        where: { supplierId: { in: supplierIds } },
        _sum: { supplierPayout: true },
      })
    : [];

  const payoutMap = new Map(
    payoutAggregations.map((a) => [a.supplierId, a._sum.supplierPayout ?? 0]),
  );

  const [totalSuppliers, activeSuppliers, totalParts, activeParts] = await Promise.all([
    prisma.user.count({ where: { role: { in: SUPPLIER_ROLES } } }),
    prisma.user.count({ where: { role: { in: SUPPLIER_ROLES }, status: "ACTIVE" } }),
    prisma.part.count({ where: { supplier: { role: { in: SUPPLIER_ROLES } } } }),
    prisma.part.count({ where: { supplier: { role: { in: SUPPLIER_ROLES } }, status: "ACTIVE" } }),
  ]);

  const serialized = suppliers.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    totalPayout: payoutMap.get(s.id) ?? 0,
  }));

  return (
    <AdminSuppliersContent
      initialData={{
        suppliers: serialized,
        total,
        totalPages: Math.ceil(total / limit),
        stats: { totalSuppliers, activeSuppliers, totalParts, activeParts },
      }}
    />
  );
}

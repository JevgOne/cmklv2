import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MyPartsClient } from "@/components/pwa-parts/parts/MyPartsClient";

export const metadata: Metadata = {
  title: "Moje díly | Carmakler",
  description: "Správa vašich dílů na platformě Carmakler.",
};

export const dynamic = "force-dynamic";

const SUPPLIER_ROLES = [
  "PARTS_SUPPLIER",
  "WHOLESALE_SUPPLIER",
  "PARTNER_VRAKOVISTE",
  "ADMIN",
  "BACKOFFICE",
];

export default async function MyPartsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !SUPPLIER_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const where = { supplierId: session.user.id };
  const baseWhere = { ...where };

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
      take: 50,
    }),
    prisma.part.count({ where }),
    prisma.part.count({ where: { ...baseWhere, status: "ACTIVE" } }),
    prisma.part.count({ where: { ...baseWhere, status: "INACTIVE" } }),
    prisma.part.count({ where: { ...baseWhere, status: "SOLD" } }),
  ]);

  const serializedParts = parts.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    status: p.status,
    viewCount: p.viewCount,
    image: p.images[0]?.url ?? null,
  }));

  const counts = {
    all: activeCount + inactiveCount + soldCount,
    ACTIVE: activeCount,
    INACTIVE: inactiveCount,
    SOLD: soldCount,
  };

  return <MyPartsClient initialParts={serializedParts} initialCounts={counts} />;
}

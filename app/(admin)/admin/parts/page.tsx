import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminPartsContent } from "@/components/admin/AdminPartsContent";

export const metadata: Metadata = {
  title: "Dily | Carmakler Admin",
  description: "Sprava dilu eshopu.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export default async function AdminPartsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const limit = 20;

  const [parts, total] = await Promise.all([
    prisma.part.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        partType: true,
        condition: true,
        status: true,
        price: true,
        stock: true,
        manufacturer: true,
        oemNumber: true,
        partNumber: true,
        viewCount: true,
        createdAt: true,
        supplier: {
          select: { id: true, firstName: true, lastName: true, companyName: true },
        },
        images: {
          select: { url: true },
          take: 1,
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.part.count(),
  ]);

  const serialized = parts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <AdminPartsContent
      initialData={{
        parts: serialized,
        total,
        totalPages: Math.ceil(total / limit),
      }}
      userRole={session.user.role}
    />
  );
}

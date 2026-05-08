import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminReturnsContent } from "@/components/admin/AdminReturnsContent";

export const metadata: Metadata = {
  title: "Reklamace | Carmakler Admin",
  description: "Sprava reklamaci a vraceni.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export default async function AdminReturnsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const limit = 20;

  const [returns, total] = await Promise.all([
    prisma.returnRequest.findMany({
      include: {
        order: {
          select: {
            orderNumber: true,
            deliveryName: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.returnRequest.count(),
  ]);

  const serialized = JSON.parse(JSON.stringify(returns));

  return (
    <AdminReturnsContent
      initialData={{
        returns: serialized,
        total,
        totalPages: Math.ceil(total / limit),
      }}
    />
  );
}

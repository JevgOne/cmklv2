import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminOrdersContent } from "@/components/admin/AdminOrdersContent";

export const metadata: Metadata = {
  title: "Objednavky | Carmakler Admin",
  description: "Sprava objednavek eshopu.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    include: {
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          part: { select: { name: true } },
        },
      },
      buyer: { select: { firstName: true, lastName: true, email: true } },
      subOrders: {
        select: {
          id: true,
          status: true,
          deliveryMethod: true,
          subtotal: true,
          trackingNumber: true,
          supplierId: true,
          supplier: { select: { companyName: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const serialized = JSON.parse(JSON.stringify(orders));

  return <AdminOrdersContent initialOrders={serialized} userRole={session.user.role} />;
}

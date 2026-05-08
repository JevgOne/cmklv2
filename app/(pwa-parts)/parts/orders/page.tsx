import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SupplierOrdersClient } from "@/components/pwa-parts/orders/SupplierOrdersClient";

export const metadata: Metadata = {
  title: "Objednávky | Carmakler",
  description: "Přehled objednávek dodavatele.",
};

export const dynamic = "force-dynamic";

export default async function SupplierOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const subOrders = await prisma.subOrder.findMany({
    where: { supplierId: session.user.id },
    include: {
      order: {
        select: {
          orderNumber: true,
          deliveryName: true,
          deliveryEmail: true,
          deliveryPhone: true,
          deliveryAddress: true,
          deliveryCity: true,
          deliveryZip: true,
          paymentMethod: true,
          paymentStatus: true,
        },
      },
      items: {
        include: {
          part: {
            select: {
              name: true,
              slug: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const serialized = JSON.parse(JSON.stringify(subOrders));

  return <SupplierOrdersClient initialOrders={serialized} />;
}

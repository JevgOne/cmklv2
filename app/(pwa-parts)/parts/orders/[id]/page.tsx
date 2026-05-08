import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { SupplierOrderDetailClient } from "@/components/pwa-parts/orders/SupplierOrderDetailClient";

export const metadata: Metadata = {
  title: "Detail objednávky | Carmakler",
  description: "Detail objednávky dodavatele.",
};

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const subOrder = await prisma.subOrder.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          orderNumber: true,
          deliveryName: true,
          deliveryPhone: true,
          deliveryEmail: true,
          deliveryAddress: true,
          deliveryCity: true,
          deliveryZip: true,
          paymentMethod: true,
          paymentStatus: true,
          note: true,
          buyerId: true,
          buyer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
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
  });

  if (!subOrder) {
    notFound();
  }

  // Auth: supplier owns this SubOrder OR admin/backoffice
  const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);
  const isSupplier = subOrder.supplierId === session.user.id;
  const isBuyer = subOrder.order.buyerId === session.user.id;

  if (!isAdmin && !isSupplier && !isBuyer) {
    redirect("/login");
  }

  const serialized = JSON.parse(JSON.stringify(subOrder));

  return <SupplierOrderDetailClient initialData={serialized} />;
}

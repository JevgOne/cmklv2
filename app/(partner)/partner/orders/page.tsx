import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PartnerOrdersList } from "@/components/partner/PartnerOrdersList";

export const metadata: Metadata = {
  title: "Objednavky | Carmakler Partner",
  description: "Prehled vasich objednavek v systemu Carmakler.",
};

export const dynamic = "force-dynamic";

export default async function PartnerOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const limit = 20;
  const orders = await prisma.order.findMany({
    where: {
      items: { some: { supplierId: session.user.id } },
    },
    include: {
      items: {
        where: { supplierId: session.user.id },
        include: {
          part: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const total = await prisma.order.count({
    where: {
      items: { some: { supplierId: session.user.id } },
    },
  });

  const serialized = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    totalPrice: o.totalPrice,
    deliveryName: o.deliveryName,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      part: { name: item.part.name, slug: item.part.slug },
    })),
  }));

  return (
    <PartnerOrdersList
      initialOrders={serialized}
      initialTotal={total}
      initialTotalPages={Math.ceil(total / limit)}
    />
  );
}

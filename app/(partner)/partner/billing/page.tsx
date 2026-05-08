import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PartnerBillingContent } from "@/components/partner/PartnerBillingContent";

export const metadata: Metadata = {
  title: "Vyuctovani | Carmakler Partner",
  description: "Prehled vasich trzeb, provizi a vyplat.",
};

export const dynamic = "force-dynamic";

export default async function PartnerBillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PARTNER_VRAKOVISTE") {
    redirect("/login");
  }

  const orderItems = await prisma.orderItem.findMany({
    where: {
      supplierId: session.user.id,
      order: { status: "DELIVERED" },
    },
    include: {
      part: { select: { name: true } },
      order: { select: { id: true, status: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const carmaklerCommission = Math.round(totalRevenue * 0.15);
  const partnerPayout = totalRevenue - carmaklerCommission;

  const serializedItems = orderItems.map((item) => ({
    id: item.id,
    price: item.unitPrice,
    quantity: item.quantity,
    partName: item.part?.name || null,
    orderDate: item.order?.createdAt?.toISOString() || null,
  }));

  return (
    <PartnerBillingContent
      data={{
        totalRevenue,
        carmaklerCommission,
        partnerPayout,
        commissionRate: 15,
        items: serializedItems,
      }}
    />
  );
}

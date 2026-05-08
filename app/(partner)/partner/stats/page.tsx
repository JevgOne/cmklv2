import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PartnerStatsContent } from "@/components/partner/PartnerStatsContent";

export const metadata: Metadata = {
  title: "Statistiky | Carmakler Partner",
  description: "Statistiky a analytika vaseho partnerskeho uctu.",
};

export const dynamic = "force-dynamic";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

export default async function PartnerStatsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
  });

  if (!partner) redirect("/partner/onboarding");

  const isBazar = session.user.role === "PARTNER_BAZAR";

  if (isBazar) {
    const [totalVehicles, activeVehicles, soldVehicles, totalLeads, totalViews] =
      await Promise.all([
        prisma.vehicle.count({ where: { brokerId: session.user.id } }),
        prisma.vehicle.count({ where: { brokerId: session.user.id, status: "ACTIVE" } }),
        prisma.vehicle.count({ where: { brokerId: session.user.id, status: "SOLD" } }),
        prisma.partnerLead.count({ where: { partnerId: partner.id } }),
        prisma.vehicle.aggregate({
          where: { brokerId: session.user.id },
          _sum: { viewCount: true },
        }),
      ]);

    const views = totalViews._sum.viewCount || 0;
    const conversionRate = views > 0 ? ((totalLeads / views) * 100).toFixed(1) : "0";

    return (
      <PartnerStatsContent
        stats={{
          type: "AUTOBAZAR",
          funnel: { views, leads: totalLeads, sold: soldVehicles },
          conversionRate,
          totalVehicles,
          activeVehicles,
        }}
        isBazar={true}
      />
    );
  }

  // Vrakoviste
  const [totalParts, activeParts, totalOrders] = await Promise.all([
    prisma.part.count({ where: { supplierId: session.user.id } }),
    prisma.part.count({ where: { supplierId: session.user.id, status: "ACTIVE" } }),
    prisma.orderItem.count({ where: { supplierId: session.user.id } }),
  ]);

  return (
    <PartnerStatsContent
      stats={{ type: "VRAKOVISTE", totalParts, activeParts, totalOrders }}
      isBazar={false}
    />
  );
}

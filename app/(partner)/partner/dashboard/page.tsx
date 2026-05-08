import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PartnerDashboardContent } from "@/components/partner/PartnerDashboardContent";

export const metadata: Metadata = {
  title: "Dashboard | Carmakler Partner",
  description: "Prehled vaseho partnerskeho uctu Carmakler.",
};

export const dynamic = "force-dynamic";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE"];

export default async function PartnerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
  });

  if (!partner) redirect("/partner/onboarding");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const isBazar = session.user.role === "PARTNER_BAZAR";

  if (isBazar) {
    const [totalVehicles, activeVehicles, leadsThisMonth, soldVehicles] =
      await Promise.all([
        prisma.vehicle.count({ where: { brokerId: session.user.id } }),
        prisma.vehicle.count({ where: { brokerId: session.user.id, status: "ACTIVE" } }),
        prisma.partnerLead.count({ where: { partnerId: partner.id, createdAt: { gte: monthStart } } }),
        prisma.vehicle.count({ where: { brokerId: session.user.id, status: "SOLD" } }),
      ]);

    const recentLeads = await prisma.partnerLead.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return (
      <PartnerDashboardContent
        data={{
          type: "AUTOBAZAR",
          stats: { totalVehicles, activeVehicles, leadsThisMonth, soldVehicles },
          recentLeads: recentLeads.map((l) => ({
            id: l.id,
            name: l.name,
            status: l.status,
            createdAt: l.createdAt.toISOString(),
          })),
        }}
        isBazar={true}
      />
    );
  }

  // Vrakoviste
  const [totalParts, activeParts, ordersThisMonth] = await Promise.all([
    prisma.part.count({ where: { supplierId: session.user.id } }),
    prisma.part.count({ where: { supplierId: session.user.id, status: "ACTIVE" } }),
    prisma.orderItem.count({ where: { supplierId: session.user.id, createdAt: { gte: monthStart } } }),
  ]);

  return (
    <PartnerDashboardContent
      data={{
        type: "VRAKOVISTE",
        stats: { totalParts, activeParts, ordersThisMonth },
      }}
      isBazar={false}
    />
  );
}

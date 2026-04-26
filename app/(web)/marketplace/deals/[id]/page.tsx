import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DealDetailClient } from "@/components/web/marketplace/DealDetailClient";

export const metadata: Metadata = {
  title: "Detail flipu | Marketplace VIP",
  robots: { index: false, follow: false },
};

const ALLOWED_ROLES = ["VERIFIED_DEALER", "INVESTOR", "ADMIN", "BACKOFFICE"];

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/marketplace?reason=not_authorized");
  }

  const { id } = await params;
  const userRole = session.user.role;
  const userId = session.user.id;

  const opp = await prisma.flipOpportunity.findUnique({
    where: { id },
    include: {
      dealer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          avatar: true,
        },
      },
      investments: {
        include: {
          investor: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!opp) notFound();

  // Dealer only sees own opportunities
  if (userRole === "VERIFIED_DEALER" && opp.dealerId !== userId) {
    redirect("/marketplace?reason=not_authorized");
  }

  // Investor can't see PENDING_APPROVAL
  if (userRole === "INVESTOR" && opp.status === "PENDING_APPROVAL") {
    redirect("/marketplace?reason=not_authorized");
  }

  // Role-based investment filtering
  const investments =
    userRole === "INVESTOR"
      ? opp.investments.filter((inv) => inv.investorId === userId)
      : opp.investments;

  const photos = opp.photos ? (JSON.parse(opp.photos) as string[]) : [];
  const repairPhotos = opp.repairPhotos
    ? (JSON.parse(opp.repairPhotos) as string[])
    : [];

  const totalNeeded = opp.purchasePrice + opp.repairCost;

  // Investor's total investment in this deal
  const investorAmount =
    userRole === "INVESTOR"
      ? investments.reduce((sum, inv) => sum + inv.amount, 0)
      : 0;

  return (
    <DealDetailClient
      opportunity={{
        id: opp.id,
        brand: opp.brand,
        model: opp.model,
        year: opp.year,
        mileage: opp.mileage,
        vin: opp.vin ?? "",
        condition: opp.condition ?? "",
        status: opp.status,
        purchasePrice: opp.purchasePrice,
        repairCost: opp.repairCost,
        estimatedSalePrice: opp.estimatedSalePrice,
        actualSalePrice: opp.actualSalePrice,
        fundedAmount: opp.fundedAmount,
        totalNeeded,
        repairDescription: opp.repairDescription,
        photos,
        repairPhotos,
        adminNotes: opp.adminNotes,
        createdAt: opp.createdAt.toISOString(),
      }}
      dealer={{
        id: opp.dealer.id,
        firstName: opp.dealer.firstName,
        lastName: opp.dealer.lastName,
        companyName: opp.dealer.companyName,
        avatar: opp.dealer.avatar,
      }}
      investments={investments.map((inv) => ({
        id: inv.id,
        investorName: `${inv.investor.firstName} ${inv.investor.lastName}`,
        amount: inv.amount,
        paymentStatus: inv.paymentStatus,
      }))}
      userRole={userRole}
      userId={userId}
      investorAmount={investorAmount}
    />
  );
}

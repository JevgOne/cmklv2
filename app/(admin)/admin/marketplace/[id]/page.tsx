import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AdminFlipDetailContent } from "@/components/admin/AdminFlipDetailContent";

export const metadata: Metadata = {
  title: "Detail flipu | Carmakler Admin",
  description: "Detail marketplace prilezitosti.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE"];

export default async function AdminFlipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const { id } = await params;

  const opportunity = await prisma.flipOpportunity.findUnique({
    where: { id },
    include: {
      dealer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
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

  if (!opportunity) {
    notFound();
  }

  const confirmedInvestors = opportunity.investments
    .filter((i) => i.paymentStatus === "CONFIRMED")
    .map((i) => ({
      name: `${i.investor.firstName} ${i.investor.lastName}`,
      amount: i.amount,
    }));

  const pendingPayments = opportunity.investments
    .filter((i) => i.paymentStatus === "PENDING")
    .map((i) => ({
      id: i.id,
      investorName: `${i.investor.firstName} ${i.investor.lastName}`,
      amount: i.amount,
      opportunityLabel: `${opportunity.brand} ${opportunity.model}`,
      variableSymbol: i.paymentReference || `MP${i.id.slice(0, 8).toUpperCase()}`,
      createdAt: i.createdAt?.toISOString().split("T")[0] || "",
    }));

  const flipData = {
    id: opportunity.id,
    brand: opportunity.brand,
    model: opportunity.model,
    year: opportunity.year,
    mileage: opportunity.mileage,
    vin: opportunity.vin,
    status: opportunity.status,
    purchasePrice: opportunity.purchasePrice,
    repairCost: opportunity.repairCost,
    estimatedSalePrice: opportunity.estimatedSalePrice,
    fundedAmount: opportunity.fundedAmount ?? 0,
    repairDescription: opportunity.repairDescription,
    photos: opportunity.photos ? JSON.parse(opportunity.photos as string) : [],
    dealerName: opportunity.dealer
      ? `${opportunity.dealer.firstName} ${opportunity.dealer.lastName}`
      : "Neznamy",
    dealerEmail: opportunity.dealer?.email || "",
    createdAt: opportunity.createdAt?.toISOString().split("T")[0] || "",
    investors: confirmedInvestors,
    payments: pendingPayments,
  };

  return <AdminFlipDetailContent initialData={flipData} />;
}

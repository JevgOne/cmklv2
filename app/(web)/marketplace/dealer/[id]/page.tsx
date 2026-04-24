import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealerFlipDetail } from "@/components/web/marketplace/DealerFlipDetail";
import type { FlipStep } from "@/components/web/marketplace/FlipTimeline";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Detail flipu | Realizátor | Marketplace",
  robots: { index: false, follow: false },
};

export default async function DealerFlipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const opp = await prisma.flipOpportunity.findUnique({
    where: { id },
    include: {
      investments: {
        include: {
          investor: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!opp) {
    notFound();
  }

  const photos = opp.photos ? JSON.parse(opp.photos) as string[] : [];
  const repairPhotos = opp.repairPhotos ? JSON.parse(opp.repairPhotos) as string[] : [];

  const flipDetail = {
    id: opp.id,
    brand: opp.brand,
    model: opp.model,
    year: opp.year,
    mileage: opp.mileage,
    vin: opp.vin,
    status: opp.status as FlipStep,
    purchasePrice: opp.purchasePrice,
    repairCost: opp.repairCost,
    estimatedSalePrice: opp.estimatedSalePrice,
    fundedAmount: opp.fundedAmount,
    neededAmount: opp.purchasePrice + opp.repairCost,
    repairDescription: opp.repairDescription,
    investors: opp.investments.map((inv) => ({
      name: `${inv.investor.firstName} ${inv.investor.lastName}`,
      amount: inv.amount,
    })),
    photos,
    repairPhotos,
    createdAt: opp.createdAt.toISOString(),
  };

  return <DealerFlipDetail flipDetail={flipDetail} />;
}

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FlipTimeline } from "@/components/web/marketplace/FlipTimeline";
import { ProfitCalculator } from "@/components/web/marketplace/ProfitCalculator";
import type { FlipStep } from "@/components/web/marketplace/FlipTimeline";
import { formatPrice } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Detail flipu | Realizátor | Marketplace | CarMakléř",
  // Gated marketplace VIP content — not indexable. Žádný canonical, místo
  // toho robots noindex.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
        <Link href="/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
          Marketplace
        </Link>
        <span>/</span>
        <Link href="/marketplace/dealer" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
          Realizátor
        </Link>
        <span>/</span>
        <span className="text-gray-900">{flipDetail.brand} {flipDetail.model}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-gray-900">
            {flipDetail.brand} {flipDetail.model}
          </h1>
          <p className="text-gray-500 mt-1">
            {flipDetail.year} · {flipDetail.mileage.toLocaleString("cs-CZ")} km · VIN: {flipDetail.vin}
          </p>
        </div>
        <Badge variant="top">V opravě</Badge>
      </div>

      {/* Timeline */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Průběh flipu</h2>
        <FlipTimeline currentStep={flipDetail.status} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo */}
          <Card className="overflow-hidden">
            {flipDetail.photos[0] && (
              <div className="relative aspect-video">
                <Image
                  src={flipDetail.photos[0]}
                  alt={`${flipDetail.brand} ${flipDetail.model}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>
            )}
          </Card>

          {/* Repair info */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Plán opravy</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{flipDetail.repairDescription}</p>

            {/* Repair photos upload area */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Fotky z opravy</h3>
              {flipDetail.repairPhotos.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <span className="text-3xl block mb-2">📸</span>
                  <p className="text-sm text-gray-500">Nahrajte fotky průběhu opravy</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Nahrát fotky
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {flipDetail.repairPhotos.map((url, i) => (
                    <div key={i} className="relative aspect-square"><Image src={url} alt={`Oprava ${i + 1}`} fill className="rounded-lg object-cover" sizes="33vw" /></div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Investors */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Investoři ({flipDetail.investors.length})
            </h2>
            <div className="space-y-3">
              {flipDetail.investors.map((inv, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{inv.name[0]}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{inv.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{formatPrice(inv.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ProfitCalculator
            initialPurchasePrice={flipDetail.purchasePrice}
            initialRepairCost={flipDetail.repairCost}
            initialSalePrice={flipDetail.estimatedSalePrice}
            readOnly
          />

          {/* Status update */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Aktualizovat stav</h3>
            <div className="space-y-3">
              <Button variant="primary" className="w-full">
                Označit jako dokončené
              </Button>
              <Button variant="outline" className="w-full">
                Aktualizovat fotky
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FlipTimeline } from "@/components/web/marketplace/FlipTimeline";
import { ProfitCalculator } from "@/components/web/marketplace/ProfitCalculator";
import type { FlipStep } from "@/components/web/marketplace/FlipTimeline";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Detail flipu | Dealer | Marketplace | CarMakler",
};

// Dummy data — bude nahrazeno daty z API
const flipDetail = {
  id: "1",
  brand: "Skoda",
  model: "Octavia III 1.6 TDI",
  year: 2016,
  mileage: 145000,
  vin: "TMBAG7NE3G0123456",
  status: "IN_REPAIR" as FlipStep,
  purchasePrice: 180000,
  repairCost: 45000,
  estimatedSalePrice: 299000,
  fundedAmount: 225000,
  neededAmount: 225000,
  repairDescription: "Vymena rozvodoveho remene, novy olejovy filtr, oprava laku na prednim narazniku, detailing interieru.",
  marketAnalysis: "Srovnatelne vozy na trhu se prodavaji za 280-320 000 Kc. Nase auto bude v nadprumernem stavu po oprave.",
  investors: [
    { name: "Investor A", amount: 100000 },
    { name: "Investor B", amount: 75000 },
    { name: "Investor C", amount: 50000 },
  ],
  photos: [
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80",
  ],
  repairPhotos: [] as string[],
  createdAt: "2026-02-15",
};

export default function DealerFlipDetailPage() {
  const totalInvested = flipDetail.investors.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
        <Link href="/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
          Marketplace
        </Link>
        <span>/</span>
        <Link href="/marketplace/dealer" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
          Dealer
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
        <Badge variant="top">V oprave</Badge>
      </div>

      {/* Timeline */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Prubeh flipu</h2>
        <FlipTimeline currentStep={flipDetail.status} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo */}
          <Card className="overflow-hidden">
            {flipDetail.photos[0] && (
              <img
                src={flipDetail.photos[0]}
                alt={`${flipDetail.brand} ${flipDetail.model}`}
                className="w-full aspect-video object-cover"
              />
            )}
          </Card>

          {/* Repair info */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Plan opravy</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{flipDetail.repairDescription}</p>

            {/* Repair photos upload area */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Fotky z opravy</h3>
              {flipDetail.repairPhotos.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <span className="text-3xl block mb-2">📸</span>
                  <p className="text-sm text-gray-500">Nahrajte fotky prubehu opravy</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Nahrat fotky
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {flipDetail.repairPhotos.map((url, i) => (
                    <img key={i} src={url} alt={`Oprava ${i + 1}`} className="rounded-lg aspect-square object-cover" />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Market analysis */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Analyza trhu</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{flipDetail.marketAnalysis}</p>
          </Card>

          {/* Investors */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Investori ({flipDetail.investors.length})
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
                Oznacit jako dokoncene
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

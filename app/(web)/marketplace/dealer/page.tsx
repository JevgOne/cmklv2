import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DealerStats } from "@/components/web/marketplace/DealerStats";
import { OpportunityCard } from "@/components/web/marketplace/OpportunityCard";

export const metadata: Metadata = {
  title: "Dealer Dashboard | Marketplace | CarMakléř",
};

// Dummy data — bude nahrazeno daty z API
const stats = {
  totalFlips: 12,
  activeFlips: 3,
  soldFlips: 8,
  averageRoi: 22,
};

const opportunities = [
  {
    id: "1",
    brand: "Skoda",
    model: "Octavia III 1.6 TDI",
    year: 2016,
    photoUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80",
    purchasePrice: 180000,
    repairCost: 45000,
    estimatedSalePrice: 299000,
    fundedAmount: 150000,
    neededAmount: 225000,
    status: "FUNDING" as const,
    dealerName: "Jan Novak",
  },
  {
    id: "2",
    brand: "VW",
    model: "Golf VII 1.4 TSI",
    year: 2017,
    photoUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80",
    purchasePrice: 165000,
    repairCost: 30000,
    estimatedSalePrice: 259000,
    fundedAmount: 195000,
    neededAmount: 195000,
    status: "IN_REPAIR" as const,
    dealerName: "Jan Novak",
  },
  {
    id: "3",
    brand: "BMW",
    model: "320d F30",
    year: 2015,
    photoUrl: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600&q=80",
    purchasePrice: 220000,
    repairCost: 65000,
    estimatedSalePrice: 389000,
    fundedAmount: 0,
    neededAmount: 285000,
    status: "PENDING_APPROVAL" as const,
    dealerName: "Jan Novak",
  },
];

export default function DealerDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1">
            <Link href="/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-gray-900">Dealer</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">
            Moje příležitosti
          </h1>
        </div>
        <Link href="/marketplace/dealer/nova" className="no-underline">
          <Button variant="primary">
            + Nová příležitost
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <DealerStats {...stats} />

      {/* Opportunities Grid */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Aktivní flipy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              {...opp}
              linkPrefix="/marketplace/dealer"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

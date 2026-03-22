import type { Metadata } from "next";
import Link from "next/link";
import { InvestorPortfolio } from "@/components/web/marketplace/InvestorPortfolio";
import { OpportunityCard } from "@/components/web/marketplace/OpportunityCard";

export const metadata: Metadata = {
  title: "Investor Dashboard | Marketplace | CarMakler",
};

// Dummy data
const portfolio = {
  totalInvested: 425000,
  activeInvestments: 3,
  totalReturns: 87500,
  averageRoi: 21,
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
    id: "4",
    brand: "Audi",
    model: "A4 2.0 TDI",
    year: 2017,
    photoUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80",
    purchasePrice: 250000,
    repairCost: 35000,
    estimatedSalePrice: 380000,
    fundedAmount: 100000,
    neededAmount: 285000,
    status: "FUNDING" as const,
    dealerName: "Petra Mala",
  },
  {
    id: "5",
    brand: "Mercedes-Benz",
    model: "C220d",
    year: 2016,
    photoUrl: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600&q=80",
    purchasePrice: 280000,
    repairCost: 55000,
    estimatedSalePrice: 449000,
    fundedAmount: 0,
    neededAmount: 335000,
    status: "APPROVED" as const,
    dealerName: "Karel Dvorak",
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
    id: "6",
    brand: "Ford",
    model: "Focus ST",
    year: 2018,
    photoUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80",
    purchasePrice: 195000,
    repairCost: 25000,
    estimatedSalePrice: 289000,
    fundedAmount: 220000,
    neededAmount: 220000,
    status: "FOR_SALE" as const,
    dealerName: "Tomas Horak",
  },
];

export default function InvestorDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1">
          <Link href="/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
            Marketplace
          </Link>
          <span>/</span>
          <span className="text-gray-900">Investor</span>
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">
          Investicni prehled
        </h1>
      </div>

      {/* Portfolio Stats */}
      <InvestorPortfolio {...portfolio} />

      {/* Available opportunities */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Dostupne prilezitosti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {opportunities
            .filter((o) => o.status === "FUNDING" || o.status === "APPROVED")
            .map((opp) => (
              <OpportunityCard key={opp.id} {...opp} />
            ))}
        </div>
      </div>

      {/* Active investments */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Moje aktivni investice</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {opportunities
            .filter((o) => o.status !== "FUNDING" && o.status !== "APPROVED")
            .map((opp) => (
              <OpportunityCard key={opp.id} {...opp} />
            ))}
        </div>
      </div>
    </div>
  );
}

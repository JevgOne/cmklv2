import { StatCard } from "@/components/ui/StatCard";
import { formatPrice } from "@/lib/utils";

export interface InvestorPortfolioProps {
  totalInvested: number;
  activeInvestments: number;
  totalReturns: number;
  averageRoi: number;
}

export function InvestorPortfolio({ totalInvested, activeInvestments, totalReturns, averageRoi }: InvestorPortfolioProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        icon="💰"
        iconColor="orange"
        value={formatPrice(totalInvested)}
        label="Celkem investováno"
      />
      <StatCard
        icon="⚡"
        iconColor="blue"
        value={activeInvestments.toString()}
        label="Aktivních investic"
      />
      <StatCard
        icon="📈"
        iconColor="green"
        value={formatPrice(totalReturns)}
        label="Celkové výnosy"
      />
      <StatCard
        icon="🎯"
        iconColor="orange"
        value={`${averageRoi}%`}
        label="Průměrný ROI"
      />
    </div>
  );
}

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
        label="Celkem investovano"
      />
      <StatCard
        icon="⚡"
        iconColor="blue"
        value={activeInvestments.toString()}
        label="Aktivnich investic"
      />
      <StatCard
        icon="📈"
        iconColor="green"
        value={formatPrice(totalReturns)}
        label="Celkove vynosy"
      />
      <StatCard
        icon="🎯"
        iconColor="orange"
        value={`${averageRoi}%`}
        label="Prumerny ROI"
      />
    </div>
  );
}

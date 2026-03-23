import { StatCard } from "@/components/ui/StatCard";

export interface DealerStatsProps {
  totalFlips: number;
  activeFlips: number;
  soldFlips: number;
  averageRoi: number;
}

export function DealerStats({ totalFlips, activeFlips, soldFlips, averageRoi }: DealerStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        icon="🔄"
        iconColor="orange"
        value={totalFlips.toString()}
        label="Celkem flipů"
      />
      <StatCard
        icon="⚡"
        iconColor="blue"
        value={activeFlips.toString()}
        label="Aktivních"
      />
      <StatCard
        icon="✅"
        iconColor="green"
        value={soldFlips.toString()}
        label="Prodaných"
      />
      <StatCard
        icon="📈"
        iconColor="orange"
        value={`${averageRoi}%`}
        label="Průměrný ROI"
      />
    </div>
  );
}

import { StatCard } from "@/components/ui/StatCard";

interface BrokerStatsProps {
  totalVehicles: number;
  soldVehicles: number;
  avgDays: number;
}

export function BrokerStats({ totalVehicles, soldVehicles, avgDays }: BrokerStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard
        icon="📋"
        iconColor="blue"
        value={String(totalVehicles)}
        label="Nabráno"
        className="p-4 [&>div:nth-child(2)]:text-xl [&>div:nth-child(2)]:mb-0"
      />
      <StatCard
        icon="✅"
        iconColor="green"
        value={String(soldVehicles)}
        label="Prodáno"
        className="p-4 [&>div:nth-child(2)]:text-xl [&>div:nth-child(2)]:mb-0"
      />
      <StatCard
        icon="⏱️"
        iconColor="orange"
        value={`${avgDays}d`}
        label="Prům. doba"
        className="p-4 [&>div:nth-child(2)]:text-xl [&>div:nth-child(2)]:mb-0"
      />
    </div>
  );
}

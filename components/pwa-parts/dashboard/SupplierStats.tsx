import { StatCard } from "@/components/ui/StatCard";

export function SupplierStats() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        icon={<span>📦</span>}
        iconColor="green"
        value="24"
        label="Aktivní díly"
        trend="up"
        trendValue="+3"
      />
      <StatCard
        icon={<span>🛒</span>}
        iconColor="orange"
        value="5"
        label="K vyřízení"
      />
      <StatCard
        icon={<span>💰</span>}
        iconColor="blue"
        value="45 800 Kč"
        label="Tržby (měsíc)"
        trend="up"
        trendValue="+12%"
      />
      <StatCard
        icon={<span>⭐</span>}
        iconColor="orange"
        value="4.8"
        label="Hodnocení"
      />
    </div>
  );
}

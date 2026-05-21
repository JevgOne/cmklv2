import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";

interface StatsRowProps {
  totalCommission: number;
  salesCount: number;
  activeVehicles: number;
}

export function StatsRow({ totalCommission, salesCount, activeVehicles }: StatsRowProps) {
  return (
    <div data-tour="dashboard-stats" className="grid grid-cols-3 gap-2 sm:gap-3">
      <Card className="p-3 sm:p-4 text-center">
        <div className="text-xl sm:text-2xl mb-1">💰</div>
        <div className="text-base sm:text-lg font-extrabold text-gray-900 tabular-nums">
          {formatPrice(totalCommission)}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">Provize</div>
      </Card>

      <Card className="p-3 sm:p-4 text-center">
        <div className="text-xl sm:text-2xl mb-1">🚗</div>
        <div className="text-base sm:text-lg font-extrabold text-gray-900 tabular-nums">{salesCount}</div>
        <div className="text-xs text-gray-500 mt-0.5">Prodeje</div>
      </Card>

      <Card className="p-3 sm:p-4 text-center">
        <div className="text-xl sm:text-2xl mb-1">📋</div>
        <div className="text-base sm:text-lg font-extrabold text-gray-900 tabular-nums">{activeVehicles}</div>
        <div className="text-xs text-gray-500 mt-0.5">Aktivní</div>
      </Card>
    </div>
  );
}

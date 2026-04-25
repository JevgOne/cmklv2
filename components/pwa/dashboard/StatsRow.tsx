import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";

interface StatsRowProps {
  totalCommission: number;
  salesCount: number;
  activeVehicles: number;
}

export function StatsRow({ totalCommission, salesCount, activeVehicles }: StatsRowProps) {
  return (
    <div data-tour="dashboard-stats" className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4">
      <Card className="min-w-[140px] snap-start p-4 flex-shrink-0">
        <div className="text-2xl mb-1">💰</div>
        <div className="text-lg font-extrabold text-gray-900">
          {formatPrice(totalCommission)}
        </div>
        <div className="text-xs text-gray-500">Provize tento měsíc</div>
      </Card>

      <Card className="min-w-[140px] snap-start p-4 flex-shrink-0">
        <div className="text-2xl mb-1">🚗</div>
        <div className="text-lg font-extrabold text-gray-900">{salesCount}</div>
        <div className="text-xs text-gray-500">Prodeje tento měsíc</div>
      </Card>

      <Card className="min-w-[140px] snap-start p-4 flex-shrink-0">
        <div className="text-2xl mb-1">📋</div>
        <div className="text-lg font-extrabold text-gray-900">{activeVehicles}</div>
        <div className="text-xs text-gray-500">Aktivní inzeráty</div>
      </Card>
    </div>
  );
}

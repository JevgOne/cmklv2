import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/utils";

interface MonthStatsProps {
  total: number;
  paid: number;
  pending: number;
  salesCount: number;
}

export function MonthStats({ total, paid, pending, salesCount }: MonthStatsProps) {
  return (
    <Card className="p-5">
      <div className="text-center mb-4">
        <div className="text-sm text-gray-500 mb-1">Celkova provize</div>
        <div className="text-3xl font-extrabold text-gray-900">
          {formatPrice(total)}
        </div>
        <div className="text-sm text-gray-400 mt-1">{salesCount} prodeju</div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-gray-100">
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-success-500">
            {formatPrice(paid)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Vyplaceno</div>
        </div>
        <div className="w-px bg-gray-100" />
        <div className="flex-1 text-center">
          <div className="text-lg font-bold text-warning-500">
            {formatPrice(pending)}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Ceka na vyplatu</div>
        </div>
      </div>
    </Card>
  );
}

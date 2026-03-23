import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

interface SaleCardProps {
  vehicleName: string;
  salePrice: number;
  commission: number;
  status: string;
  date: string;
}

const statusConfig: Record<string, { variant: "verified" | "pending" | "default"; label: string }> = {
  PAID: { variant: "verified", label: "Vyplaceno" },
  PENDING: { variant: "pending", label: "Čeká" },
  CANCELLED: { variant: "default", label: "Zrušeno" },
};

export function SaleCard({ vehicleName, salePrice, commission, status, date }: SaleCardProps) {
  const config = statusConfig[status] || { variant: "default" as const, label: status };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-gray-900 text-sm truncate">
            {vehicleName}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Prodejní cena: {formatPrice(salePrice)}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {new Date(date).toLocaleDateString("cs-CZ")}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-extrabold text-success-500">
            +{formatPrice(commission)}
          </div>
          <Badge variant={config.variant} className="mt-1">
            {config.label}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

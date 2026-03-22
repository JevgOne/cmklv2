import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

interface SupplierOrderCardProps {
  id: string;
  buyerName: string;
  itemName: string;
  quantity: number;
  totalPrice: number;
  status: "NEW" | "CONFIRMED" | "PACKING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  date: string;
  deliveryMethod: string;
}

const statusConfig = {
  NEW: { label: "Nová", variant: "new" as const },
  CONFIRMED: { label: "Potvrzena", variant: "pending" as const },
  PACKING: { label: "Balení", variant: "pending" as const },
  SHIPPED: { label: "Odesláno", variant: "verified" as const },
  DELIVERED: { label: "Doručeno", variant: "verified" as const },
  CANCELLED: { label: "Zrušena", variant: "rejected" as const },
};

export function OrderCard({
  id,
  buyerName,
  itemName,
  quantity,
  totalPrice,
  status,
  date,
  deliveryMethod,
}: SupplierOrderCardProps) {
  const cfg = statusConfig[status];

  return (
    <Link href={`/parts/orders/${id}`} className="block no-underline">
      <Card className="p-4 active:scale-[0.98] transition-transform">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">{buyerName}</span>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>
            <span className="text-xs text-gray-400 font-mono">#{id.slice(0, 8).toUpperCase()}</span>
          </div>
          <span className="text-xs text-gray-400">{date}</span>
        </div>

        <p className="text-sm text-gray-600">
          {itemName} {quantity > 1 && `x${quantity}`}
        </p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">{deliveryMethod}</span>
          <span className="font-bold text-gray-900">{formatPrice(totalPrice)}</span>
        </div>
      </Card>
    </Link>
  );
}

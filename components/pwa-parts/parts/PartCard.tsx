import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

interface PartCardProps {
  id: string;
  name: string;
  category: string;
  price: number;
  status: "ACTIVE" | "INACTIVE" | "SOLD" | "RESERVED";
  image?: string;
  views: number;
  quantity: number;
}

const statusConfig = {
  ACTIVE: { label: "Aktivní", variant: "verified" as const },
  INACTIVE: { label: "Neaktivní", variant: "default" as const },
  SOLD: { label: "Prodáno", variant: "pending" as const },
  RESERVED: { label: "Rezervováno", variant: "new" as const },
};

export const PartCard = memo(function PartCard({ id, name, category, price, status, image, views, quantity }: PartCardProps) {
  const cfg = statusConfig[status];

  return (
    <Link href={`/parts/my`} className="block no-underline">
      <Card className="p-3 active:scale-[0.98] transition-transform">
        <div className="flex gap-3">
          {/* Image */}
          <div className="relative w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            {image ? (
              <Image src={image} alt={name} fill className="object-cover" sizes="64px" />
            ) : (
              <span className="text-2xl text-gray-300">🔧</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-sm font-semibold text-gray-900 truncate">{name}</h4>
              <Badge variant={cfg.variant} className="shrink-0">{cfg.label}</Badge>
            </div>
            <p className="text-xs text-gray-500">{category}</p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="font-bold text-gray-900">{formatPrice(price)}</span>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>Sklad: {quantity}</span>
                <span>{views} zobrazení</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
});

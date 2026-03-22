"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

const pendingOrders = [
  {
    id: "pord-001",
    buyerName: "Jan Novák",
    item: "Dveře přední levé - Octavia III",
    price: 4500,
    date: "Dnes 14:30",
    status: "NEW" as const,
  },
  {
    id: "pord-002",
    buyerName: "Marie Svobodová",
    item: "Turbodmychadlo 2.0 TDI",
    price: 12000,
    date: "Dnes 11:15",
    status: "NEW" as const,
  },
  {
    id: "pord-003",
    buyerName: "Petr Dvořák",
    item: "LED světlomet BMW F30",
    price: 8500,
    date: "Včera 18:45",
    status: "CONFIRMED" as const,
  },
];

const statusConfig = {
  NEW: { label: "Nová", variant: "new" as const },
  CONFIRMED: { label: "Potvrzena", variant: "pending" as const },
  PACKING: { label: "Balení", variant: "pending" as const },
};

export function PendingOrders() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">Objednávky k vyřízení</h3>
        <Link
          href="/parts/orders"
          className="text-sm text-green-600 font-semibold no-underline"
        >
          Vše
        </Link>
      </div>

      <div className="space-y-3">
        {pendingOrders.map((order) => {
          const cfg = statusConfig[order.status] ?? statusConfig.NEW;
          return (
            <Link
              key={order.id}
              href={`/parts/orders/${order.id}`}
              className="block no-underline"
            >
              <Card className="p-4 active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {order.buyerName}
                      </span>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{order.item}</p>
                    <p className="text-xs text-gray-400 mt-1">{order.date}</p>
                  </div>
                  <span className="font-bold text-gray-900 shrink-0">
                    {formatPrice(order.price)}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

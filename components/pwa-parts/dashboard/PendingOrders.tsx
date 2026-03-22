"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

interface PendingOrder {
  id: string;
  deliveryName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    part: { name: string; slug: string };
  }[];
}

const statusConfig: Record<string, { label: string; variant: "new" | "pending" }> = {
  PENDING: { label: "Nova", variant: "new" },
  CONFIRMED: { label: "Potvrzena", variant: "pending" },
};

export function PendingOrders() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders?role=supplier&limit=5");
        if (res.ok) {
          const data = await res.json();
          // Filter to only pending/confirmed
          const pending = (data.orders ?? []).filter(
            (o: PendingOrder) => o.status === "PENDING" || o.status === "CONFIRMED"
          );
          setOrders(pending.slice(0, 5));
        }
      } catch {
        // Zustane prazdne
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div>
        <h3 className="font-bold text-gray-900 mb-3">Objednavky k vyrizeni</h3>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">Objednavky k vyrizeni</h3>
        <Link
          href="/parts/orders"
          className="text-sm text-green-600 font-semibold no-underline"
        >
          Vse
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-gray-400 text-center">
            Zadne objednavky k vyrizeni
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cfg = statusConfig[order.status] ?? statusConfig.PENDING;
            const firstItem = order.items[0];
            const date = new Date(order.createdAt);
            const isToday = new Date().toDateString() === date.toDateString();
            const dateStr = isToday
              ? `Dnes ${date.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}`
              : date.toLocaleDateString("cs-CZ");

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
                          {order.deliveryName}
                        </span>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {firstItem?.part.name ?? "Dil"} x{firstItem?.quantity ?? 1}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{dateStr}</p>
                    </div>
                    <span className="font-bold text-gray-900 shrink-0">
                      {formatPrice(order.totalPrice)}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

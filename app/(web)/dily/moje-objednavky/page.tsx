"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OrderTracker } from "@/components/web/OrderTracker";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

type OrderTrackerStatus = "NEW" | "CONFIRMED" | "PACKING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

function mapToTrackerStatus(apiStatus: string): OrderTrackerStatus {
  switch (apiStatus) {
    case "PENDING": return "NEW";
    case "CONFIRMED": return "CONFIRMED";
    case "SHIPPED": return "SHIPPED";
    case "DELIVERED": return "DELIVERED";
    case "CANCELLED": return "CANCELLED";
    default: return "NEW";
  }
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  part: { name: string; slug: string; images?: { url: string }[] };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  trackingNumber: string | null;
  totalPrice: number;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

const statusBadge: Record<string, { label: string; variant: "verified" | "pending" | "new" | "default" | "rejected" }> = {
  PENDING: { label: "Nova", variant: "new" },
  CONFIRMED: { label: "Potvrzena", variant: "pending" },
  SHIPPED: { label: "Odeslano", variant: "verified" },
  DELIVERED: { label: "Doruceno", variant: "verified" },
  CANCELLED: { label: "Zrusena", variant: "rejected" },
};

export default function DilyMojeObjednavkyPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders?role=buyer");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders ?? []);
        }
      } catch {
        // Zustanou prazdne
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Moje objednavky</h1>
          <p className="text-gray-500 mt-1">Prehled vasich objednavek</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">📦</span>
            <h3 className="text-xl font-bold text-gray-900">Zatim zadne objednavky</h3>
            <p className="text-gray-500 mt-2">Prozkoumejte nas katalog a objednejte si dily</p>
            <Link href="/dily/katalog" className="inline-block mt-6 text-orange-500 font-semibold hover:text-orange-600 no-underline">
              Prohlizet katalog
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const badge = statusBadge[order.status] ?? statusBadge.PENDING;
            const date = new Date(order.createdAt).toLocaleDateString("cs-CZ");
            return (
              <Card key={order.id} className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-500">#{order.orderNumber}</span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <span className="text-sm text-gray-400">{date}</span>
                </div>
                <div className="mb-6">
                  <OrderTracker status={mapToTrackerStatus(order.status)} />
                </div>
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.part.name} x {item.quantity}</span>
                      <span className="font-medium text-gray-900">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
                <hr className="my-3 border-gray-200" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-gray-500">
                    {order.paymentMethod === "BANK_TRANSFER" ? "Prevod" : "Dobirka"}
                    {order.trackingNumber && (
                      <span className="ml-2 text-orange-500 font-medium">Tracking: {order.trackingNumber}</span>
                    )}
                  </div>
                  <div className="text-lg font-extrabold text-gray-900">{formatPrice(order.totalPrice)}</div>
                </div>
              </Card>
            );
          })
        )}

        <div className="text-center pt-4">
          <Link href="/dily" className="text-orange-500 font-semibold hover:text-orange-600 no-underline">
            Zpet do shopu
          </Link>
        </div>
      </div>
    </div>
  );
}

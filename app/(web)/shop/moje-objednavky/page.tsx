"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OrderTracker } from "@/components/web/OrderTracker";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

type OrderTrackerStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

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
  part: {
    name: string;
    slug: string;
    images?: { url: string }[];
  };
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
  PENDING: { label: "Nová", variant: "new" },
  CONFIRMED: { label: "Potvrzena", variant: "pending" },
  SHIPPED: { label: "Odesláno", variant: "verified" },
  DELIVERED: { label: "Doručeno", variant: "verified" },
  CANCELLED: { label: "Zrušena", variant: "rejected" },
};

export default function MojeObjednavkyPage() {
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
        // Zůstanou prázdné
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Moje objednávky</h1>
          <p className="text-gray-500 mt-1">Přehled vašich objednávek z e-shopu</p>
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
            <h3 className="text-xl font-bold text-gray-900">Zatím žádné objednávky</h3>
            <p className="text-gray-500 mt-2">Prozkoumejte náš katalog a objednejte si díly</p>
            <Link
              href="/shop/katalog"
              className="inline-block mt-6 text-orange-500 font-semibold hover:text-orange-600 no-underline"
            >
              Procházet katalog
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const badge = statusBadge[order.status] ?? statusBadge.PENDING;
            const date = new Date(order.createdAt).toLocaleDateString("cs-CZ");
            return (
              <Card key={order.id} className="p-6">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-500">
                      #{order.orderNumber}
                    </span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <span className="text-sm text-gray-500">{date}</span>
                </div>

                {/* Tracker */}
                <div className="mb-6">
                  <OrderTracker status={mapToTrackerStatus(order.status)} />
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.part.name} x {item.quantity}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                <hr className="my-3 border-gray-200" />

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-gray-500">
                    {order.paymentMethod === "BANK_TRANSFER" ? "Převod" : "Dobírka"}
                    {order.trackingNumber && (
                      <span className="ml-2 text-orange-500 font-medium">
                        Tracking: {order.trackingNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-extrabold text-gray-900">
                    {formatPrice(order.totalPrice)}
                  </div>
                </div>

                {order.status === "DELIVERED" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <Link href={`/shop/moje-objednavky/${order.id}/vraceni`}>
                      <Button variant="outline" size="sm">Chci vrátit</Button>
                    </Link>
                    <Link href={`/shop/moje-objednavky/${order.id}/reklamace`}>
                      <Button variant="outline" size="sm">Reklamovat</Button>
                    </Link>
                  </div>
                )}
              </Card>
            );
          })
        )}

        {/* Link back */}
        <div className="text-center pt-4">
          <Link
            href="/shop"
            className="text-orange-500 font-semibold hover:text-orange-600 no-underline"
          >
            Zpět do shopu
          </Link>
        </div>
      </div>
    </div>
  );
}

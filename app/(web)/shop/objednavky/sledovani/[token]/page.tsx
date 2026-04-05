"use client";

import { useState, useEffect, use } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

const statusBadge: Record<string, { label: string; variant: "verified" | "pending" | "new" | "default" | "rejected" }> = {
  PENDING: { label: "Nova", variant: "new" },
  CONFIRMED: { label: "Potvrzena", variant: "pending" },
  SHIPPED: { label: "Odeslano", variant: "verified" },
  DELIVERED: { label: "Doruceno", variant: "verified" },
  CANCELLED: { label: "Zrusena", variant: "rejected" },
};

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
  totalPrice: number;
  shippingPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  trackingNumber: string | null;
  deliveryName: string;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: OrderItem[];
}

export default function SledovaniPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/track/${token}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        } else {
          setError("Objednavka nenalezena nebo neplatny odkaz");
        }
      } catch {
        setError("Chyba pri nacitani");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Nacitani objednavky...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Objednavka nenalezena</h1>
          <p className="text-gray-500 mb-6">
            {error ?? "Odkaz pro sledovani je neplatny nebo vyprsela jeho platnost."}
          </p>
          <Link href="/shop" className="no-underline">
            <Button variant="outline">Zpet do shopu</Button>
          </Link>
        </div>
      </div>
    );
  }

  const badge = statusBadge[order.status] ?? statusBadge.PENDING;
  const date = new Date(order.createdAt).toLocaleDateString("cs-CZ");

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Sledovani objednavky</h1>
          <p className="text-gray-500 mt-1">Objednavka #{order.orderNumber}</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Status */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-gray-500">#{order.orderNumber}</span>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <span className="text-sm text-gray-500">{date}</span>
          </div>

          <div className="mb-4">
            <OrderTracker status={mapToTrackerStatus(order.status)} />
          </div>

          {order.trackingNumber && (
            <div className="text-sm text-orange-500 font-medium">
              Tracking cislo: {order.trackingNumber}
            </div>
          )}
        </Card>

        {/* Items */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Polozky objednavky</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.part.name} x {item.quantity}
                </span>
                <span className="font-medium text-gray-900">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          <hr className="my-3 border-gray-200" />
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Doprava</span>
            <span className="text-sm font-medium text-gray-900">
              {order.shippingPrice > 0 ? formatPrice(order.shippingPrice) : "Zdarma"}
            </span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="font-bold text-gray-900">Celkem</span>
            <span className="text-xl font-extrabold text-gray-900">{formatPrice(order.totalPrice)}</span>
          </div>
        </Card>

        {/* Info */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informace</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Doruceni pro</span>
              <span className="text-gray-900">{order.deliveryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Platba</span>
              <span className="text-gray-900">
                {order.paymentMethod === "BANK_TRANSFER" ? "Bankovni prevod" : "Dobirka"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Stav platby</span>
              <span className="text-gray-900">
                {order.paymentStatus === "PAID" ? "Zaplaceno" : "Ceka na platbu"}
              </span>
            </div>
            {order.shippedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Odeslano</span>
                <span className="text-gray-900">{new Date(order.shippedAt).toLocaleDateString("cs-CZ")}</span>
              </div>
            )}
            {order.deliveredAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Doruceno</span>
                <span className="text-gray-900">{new Date(order.deliveredAt).toLocaleDateString("cs-CZ")}</span>
              </div>
            )}
          </div>
        </Card>

        {/* CTA: Registration */}
        <Card className="p-6 bg-orange-50 border border-orange-200">
          <h3 className="font-bold text-gray-900 mb-2">Registrujte se pro snadnejsi sledovani</h3>
          <p className="text-sm text-gray-600 mb-4">
            S uctem uvidite vsechny sve objednavky na jednom miste a muzete je snadno reklamovat.
          </p>
          <Link href="/registrace" className="no-underline">
            <Button variant="primary" size="sm">Vytvorit ucet</Button>
          </Link>
        </Card>

        <div className="text-center pt-4">
          <Link href="/shop" className="text-orange-500 font-semibold hover:text-orange-600 no-underline">
            Zpet do shopu
          </Link>
        </div>
      </div>
    </div>
  );
}

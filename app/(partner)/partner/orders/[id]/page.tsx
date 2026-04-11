"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  part: { name: string; slug: string; images?: Array<{ url: string }> };
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  shippingPrice: number;
  deliveryMethod: string;
  deliveryName: string;
  deliveryEmail: string | null;
  deliveryPhone: string | null;
  deliveryStreet: string | null;
  deliveryCity: string | null;
  deliveryZip: string | null;
  trackingNumber: string | null;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
  buyer: { firstName: string; lastName: string; email: string } | null;
}

const statusConfig: Record<string, { label: string; variant: "new" | "pending" | "verified" | "rejected" | "default" }> = {
  PENDING: { label: "Nová", variant: "new" },
  CONFIRMED: { label: "Potvrzená", variant: "pending" },
  SHIPPED: { label: "Odesláno", variant: "verified" },
  DELIVERED: { label: "Doručeno", variant: "verified" },
  CANCELLED: { label: "Zrušená", variant: "rejected" },
};

export default function PartnerOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [showTrackingInput, setShowTrackingInput] = useState(false);

  const downloadPdf = async (type: "delivery" | "confirmation") => {
    try {
      const res = await fetch(`/api/partner/orders/${id}/pdf?type=${type}`, {
        method: "POST",
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type === "delivery" ? "dodaci-list" : "potvrzeni"}-${order?.orderNumber || id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // silent fail
    }
  };

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      }
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus: string, trackingNumber?: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = { status: newStatus };
      if (trackingNumber) body.trackingNumber = trackingNumber;

      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowTrackingInput(false);
        setTrackingInput("");
        await fetchOrder();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Změna stavu se nezdařila");
      }
    } catch {
      setError("Chyba připojení");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-lg font-bold text-gray-900">Objednávka nenalezena</h2>
        <Link href="/partner/orders" className="no-underline">
          <Button variant="primary" size="sm" className="mt-4">Zpět na objednávky</Button>
        </Link>
      </div>
    );
  }

  const cfg = statusConfig[order.status] ?? statusConfig.PENDING;
  const itemsTotal = order.items.reduce((sum, i) => sum + i.totalPrice, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            Objednávka #{order.orderNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.createdAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>
      )}

      {/* Buyer info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Kupující</h3>
        <div className="text-sm text-gray-900 font-semibold">{order.deliveryName}</div>
        {order.buyer && <div className="text-sm text-gray-500">{order.buyer.email}</div>}
        {order.deliveryPhone && <div className="text-sm text-gray-500">{order.deliveryPhone}</div>}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Položky</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">{item.part.name}</div>
                <div className="text-xs text-gray-500">{item.quantity}× {formatPrice(item.unitPrice)}</div>
              </div>
              <div className="text-sm font-bold text-gray-900">{formatPrice(item.totalPrice)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Doručení</h3>
        <div className="text-sm text-gray-900">{order.deliveryMethod}</div>
        {order.deliveryStreet && (
          <div className="text-sm text-gray-500 mt-1">
            {order.deliveryStreet}, {order.deliveryCity} {order.deliveryZip}
          </div>
        )}
        {order.trackingNumber && (
          <div className="text-sm text-gray-500 mt-1">
            Sledovací číslo: <span className="font-mono">{order.trackingNumber}</span>
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Cena</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Položky</span>
            <span className="text-gray-900">{formatPrice(itemsTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Doprava</span>
            <span className="text-gray-900">{formatPrice(order.shippingPrice)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100 font-bold">
            <span className="text-gray-900">Celkem</span>
            <span className="text-orange-500">{formatPrice(order.totalPrice)}</span>
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Platba: {order.paymentMethod} ({order.paymentStatus})
        </div>
      </div>

      {/* PDF download buttons */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => downloadPdf("delivery")}
        >
          Dodaci list
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => downloadPdf("confirmation")}
        >
          Potvrzeni objednavky
        </Button>
      </div>

      {/* Status actions */}
      <div className="space-y-3">
        {order.status === "PENDING" && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => handleStatusChange("CONFIRMED")}
            disabled={actionLoading}
          >
            {actionLoading ? "Potvrzuji..." : "Potvrdit objednávku"}
          </Button>
        )}

        {order.status === "CONFIRMED" && !showTrackingInput && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => setShowTrackingInput(true)}
            disabled={actionLoading}
          >
            Odeslat
          </Button>
        )}

        {order.status === "CONFIRMED" && showTrackingInput && (
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            <Input
              label="Sledovací číslo (volitelné)"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="např. DR1234567890CZ"
            />
            <div className="flex gap-3">
              <Button variant="outline" size="default" className="flex-1" onClick={() => setShowTrackingInput(false)}>
                Zrušit
              </Button>
              <Button
                variant="primary"
                size="default"
                className="flex-1"
                onClick={() => handleStatusChange("SHIPPED", trackingInput || undefined)}
                disabled={actionLoading}
              >
                {actionLoading ? "Odesílám..." : "Potvrdit odeslání"}
              </Button>
            </div>
          </div>
        )}

        {order.status === "SHIPPED" && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => handleStatusChange("DELIVERED")}
            disabled={actionLoading}
          >
            {actionLoading ? "Označuji..." : "Označit jako doručeno"}
          </Button>
        )}

        {!["DELIVERED", "CANCELLED"].includes(order.status) && (
          <Button
            variant="outline"
            size="lg"
            className="w-full text-red-500 border-red-200 hover:bg-red-50"
            onClick={() => handleStatusChange("CANCELLED")}
            disabled={actionLoading}
          >
            Zrušit objednávku
          </Button>
        )}
      </div>

      {/* Back */}
      <Link href="/partner/orders" className="block no-underline">
        <Button variant="outline" size="lg" className="w-full">
          Zpět na objednávky
        </Button>
      </Link>
    </div>
  );
}

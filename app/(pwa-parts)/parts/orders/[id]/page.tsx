"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OrderActions } from "@/components/pwa-parts/orders/OrderActions";
import { ShippingLabelCard } from "@/components/pwa-parts/orders/ShippingLabelCard";
import { formatPrice } from "@/lib/utils";

type OrderStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

// Mapování API statusů na interní
function mapStatus(apiStatus: string): OrderStatus {
  switch (apiStatus) {
    case "PENDING": return "NEW";
    case "CONFIRMED": return "CONFIRMED";
    case "SHIPPED": return "SHIPPED";
    case "DELIVERED": return "DELIVERED";
    case "CANCELLED": return "CANCELLED";
    default: return "NEW";
  }
}

// Mapování interních statusů na API
function mapToApiStatus(status: OrderStatus): string {
  switch (status) {
    case "NEW": return "PENDING";
    default: return status;
  }
}

const statusConfig: Record<OrderStatus, { label: string; variant: "new" | "pending" | "verified" | "rejected" }> = {
  NEW: { label: "Nová", variant: "new" },
  CONFIRMED: { label: "Potvrzena", variant: "pending" },
  SHIPPED: { label: "Odesláno", variant: "verified" },
  DELIVERED: { label: "Doručeno", variant: "verified" },
  CANCELLED: { label: "Zrušena", variant: "rejected" },
};

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryEmail: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryZip: string;
  deliveryMethod: string;
  zasilkovnaPointName: string | null;
  paymentMethod: string;
  totalPrice: number;
  shippingPrice: number;
  note: string | null;
  createdAt: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  trackingUrl: string | null;
  shippingLabelUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    part: { name: string; slug: string };
    supplier: { id: string; firstName: string; lastName: string; companyName: string | null };
  }[];
  buyer: { id: string; firstName: string; lastName: string; email: string } | null;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState<OrderStatus>("NEW");
  const [loading, setLoading] = useState(true);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setStatus(mapStatus(data.order.status));
      }
    } catch {
      // Zůstane null
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    const apiStatus = mapToApiStatus(newStatus);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: apiStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
      }
    } catch {
      // Tiché selhání — lokálně aktualizujeme
      setStatus(newStatus);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto text-center py-16">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-gray-500 font-medium">Objednávka nenalezena</p>
      </div>
    );
  }

  const cfg = statusConfig[status];
  const buyerName = order.buyer
    ? `${order.buyer.firstName} ${order.buyer.lastName}`
    : order.deliveryName;
  const buyerEmail = order.buyer?.email ?? order.deliveryEmail;
  const date = new Date(order.createdAt).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const supplierCount = new Set(order.items.map((i) => i.supplier.id)).size;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            Objednávka
          </h1>
          <span className="text-sm text-gray-500 font-mono">
            #{order.orderNumber}
          </span>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      {/* Buyer info */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
          Kupující
        </h3>
        <div className="space-y-1.5 text-sm">
          <p className="font-semibold text-gray-900">{buyerName}</p>
          <p className="text-gray-600">{buyerEmail}</p>
          <p className="text-gray-600">{order.deliveryPhone}</p>
        </div>
      </Card>

      {/* Items */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
          Položky
        </h3>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">
              {item.part.name} x{item.quantity}
            </span>
            <span className="font-medium">{formatPrice(item.totalPrice)}</span>
          </div>
        ))}
        <hr className="my-3 border-gray-200" />
        <div className="flex justify-between text-sm font-bold">
          <span>Celkem</span>
          <span className="text-lg">{formatPrice(order.totalPrice)}</span>
        </div>
      </Card>

      {/* Delivery & payment */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
          Doručení a platba
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Adresa</span>
            <span className="font-medium text-right max-w-[60%]">
              {order.deliveryAddress}, {order.deliveryZip} {order.deliveryCity}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Platba</span>
            <span className="font-medium">
              {order.paymentMethod === "BANK_TRANSFER" ? "Převod" : "Dobírka"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Datum</span>
            <span className="font-medium">{date}</span>
          </div>
        </div>
      </Card>

      {/* Note */}
      {order.note && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
            Poznámka
          </h3>
          <p className="text-sm text-gray-600">{order.note}</p>
        </Card>
      )}

      {/* Shipping label & mark-shipped flow — zobraz jen když objednávka není NEW/CANCELLED */}
      {status !== "NEW" && status !== "CANCELLED" && (
        <ShippingLabelCard
          orderId={order.id}
          orderNumber={order.orderNumber}
          deliveryMethod={order.deliveryMethod}
          trackingCarrier={order.trackingCarrier}
          trackingNumber={order.trackingNumber}
          trackingUrl={order.trackingUrl}
          shippingLabelUrl={order.shippingLabelUrl}
          shippedAt={order.shippedAt}
          zasilkovnaPointName={order.zasilkovnaPointName}
          deliveryAddress={{
            street: order.deliveryAddress,
            city: order.deliveryCity,
            zip: order.deliveryZip,
            name: order.deliveryName,
          }}
          supplierCount={supplierCount}
          onShipped={fetchOrder}
          onDelivered={fetchOrder}
        />
      )}

      {/* Actions */}
      <OrderActions
        status={status}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

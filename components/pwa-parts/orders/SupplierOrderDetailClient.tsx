"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OrderActions } from "@/components/pwa-parts/orders/OrderActions";
import { ShippingLabelCard } from "@/components/pwa-parts/orders/ShippingLabelCard";
import { formatPrice } from "@/lib/utils";

type OrderStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

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

interface SubOrderDetail {
  id: string;
  status: string;
  deliveryMethod: string;
  zasilkovnaPointName: string | null;
  subtotal: number;
  shippingPrice: number;
  createdAt: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  trackingUrl: string | null;
  shippingLabelUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  order: {
    orderNumber: string;
    deliveryName: string;
    deliveryPhone: string;
    deliveryEmail: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryZip: string;
    paymentMethod: string;
    note: string | null;
    buyer: { id: string; firstName: string; lastName: string; email: string } | null;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    part: { name: string; slug: string };
  }[];
}

interface SupplierOrderDetailClientProps {
  initialData: SubOrderDetail;
}

export function SupplierOrderDetailClient({ initialData }: SupplierOrderDetailClientProps) {
  const [order, setOrder] = useState<SubOrderDetail>(initialData);
  const [status, setStatus] = useState<OrderStatus>(mapStatus(initialData.status));

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/suborders/${order.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.subOrder);
        setStatus(mapStatus(data.subOrder.status));
      }
    } catch {
      // Keep current state
    }
  }, [order.id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    const apiStatus = mapToApiStatus(newStatus);
    try {
      const res = await fetch(`/api/suborders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: apiStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
      }
    } catch {
      setStatus(newStatus);
    }
  };

  const cfg = statusConfig[status];
  const buyerName = order.order.buyer
    ? `${order.order.buyer.firstName} ${order.order.buyer.lastName}`
    : order.order.deliveryName;
  const buyerEmail = order.order.buyer?.email ?? order.order.deliveryEmail;
  const date = new Date(order.createdAt).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            Objednávka
          </h1>
          <span className="text-sm text-gray-500 font-mono">
            #{order.order.orderNumber}
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
          <p className="text-gray-600">{order.order.deliveryPhone}</p>
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
          <span className="text-lg">{formatPrice(order.subtotal)}</span>
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
              {order.order.deliveryAddress}, {order.order.deliveryZip} {order.order.deliveryCity}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Platba</span>
            <span className="font-medium">
              {order.order.paymentMethod === "BANK_TRANSFER" ? "Převod" : "Dobírka"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Datum</span>
            <span className="font-medium">{date}</span>
          </div>
        </div>
      </Card>

      {/* Note */}
      {order.order.note && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
            Poznámka
          </h3>
          <p className="text-sm text-gray-600">{order.order.note}</p>
        </Card>
      )}

      {/* Shipping label */}
      {status !== "NEW" && status !== "CANCELLED" && (
        <ShippingLabelCard
          orderId={order.id}
          orderNumber={order.order.orderNumber}
          deliveryMethod={order.deliveryMethod}
          trackingCarrier={order.trackingCarrier}
          trackingNumber={order.trackingNumber}
          trackingUrl={order.trackingUrl}
          shippingLabelUrl={order.shippingLabelUrl}
          shippedAt={order.shippedAt}
          zasilkovnaPointName={order.zasilkovnaPointName}
          deliveryAddress={{
            street: order.order.deliveryAddress,
            city: order.order.deliveryCity,
            zip: order.order.deliveryZip,
            name: order.order.deliveryName,
          }}
          supplierCount={1}
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

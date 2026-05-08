"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { OrderCard } from "@/components/pwa-parts/orders/OrderCard";

const tabs = [
  { value: "all", label: "Vše" },
  { value: "PENDING", label: "Nové" },
  { value: "to-ship", label: "K odeslání" },
  { value: "active", label: "Aktivní" },
  { value: "done", label: "Dokončené" },
];

interface SubOrderResult {
  id: string;
  status: string;
  subtotal: number;
  deliveryMethod: string;
  trackingCarrier: string | null;
  shippingLabelUrl: string | null;
  shippedAt: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    deliveryName: string;
  };
  items: {
    id: string;
    quantity: number;
    part: { name: string; slug: string };
  }[];
}

function mapStatus(apiStatus: string): "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" {
  switch (apiStatus) {
    case "PENDING": return "NEW";
    case "CONFIRMED": return "CONFIRMED";
    case "SHIPPED": return "SHIPPED";
    case "DELIVERED": return "DELIVERED";
    case "CANCELLED": return "CANCELLED";
    default: return "NEW";
  }
}

function getShippingBadge(so: SubOrderResult): "label-ready" | "shipped" | null {
  if (so.shippedAt) return "shipped";
  if (so.shippingLabelUrl && !so.shippedAt && so.status !== "CANCELLED") {
    return "label-ready";
  }
  return null;
}

interface SupplierOrdersClientProps {
  initialOrders: SubOrderResult[];
}

export function SupplierOrdersClient({ initialOrders }: SupplierOrdersClientProps) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = (() => {
    switch (activeTab) {
      case "PENDING":
        return initialOrders.filter((o) => o.status === "PENDING");
      case "to-ship":
        return initialOrders.filter(
          (o) =>
            o.shippingLabelUrl != null &&
            o.shippedAt == null &&
            o.status !== "CANCELLED"
        );
      case "active":
        return initialOrders.filter((o) => ["CONFIRMED", "SHIPPED"].includes(o.status));
      case "done":
        return initialOrders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));
      default:
        return initialOrders;
    }
  })();

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-extrabold text-gray-900">Objednávky</h1>

      <div className="overflow-x-auto -mx-4 px-4">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="space-y-3">
        {filtered.map((so) => {
          const firstItem = so.items[0];
          const date = new Date(so.createdAt);
          const isToday = new Date().toDateString() === date.toDateString();
          const dateStr = isToday
            ? `Dnes ${date.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}`
            : date.toLocaleDateString("cs-CZ");

          return (
            <OrderCard
              key={so.id}
              id={so.id}
              buyerName={so.order.deliveryName}
              itemName={firstItem?.part.name ?? "Díl"}
              quantity={firstItem?.quantity ?? 1}
              totalPrice={so.subtotal}
              status={mapStatus(so.status)}
              date={dateStr}
              deliveryMethod={so.deliveryMethod ?? ""}
              shippingBadge={getShippingBadge(so)}
            />
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 font-medium">Žádné objednávky</p>
        </div>
      )}
    </div>
  );
}

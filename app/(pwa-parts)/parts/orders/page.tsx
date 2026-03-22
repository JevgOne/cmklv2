"use client";

import { useState, useEffect } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { OrderCard } from "@/components/pwa-parts/orders/OrderCard";

const tabs = [
  { value: "all", label: "Vše" },
  { value: "PENDING", label: "Nové" },
  { value: "active", label: "Aktivní" },
  { value: "done", label: "Dokončené" },
];

interface OrderResult {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  deliveryName: string;
  items: {
    id: string;
    quantity: number;
    part: { name: string; slug: string };
  }[];
}

// Mapování statusu pro OrderCard
function mapStatus(apiStatus: string): "NEW" | "CONFIRMED" | "PACKING" | "SHIPPED" | "DELIVERED" | "CANCELLED" {
  switch (apiStatus) {
    case "PENDING": return "NEW";
    case "CONFIRMED": return "CONFIRMED";
    case "SHIPPED": return "SHIPPED";
    case "DELIVERED": return "DELIVERED";
    case "CANCELLED": return "CANCELLED";
    default: return "NEW";
  }
}

export default function SupplierOrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<OrderResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders?role=supplier");
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

  const filtered = (() => {
    switch (activeTab) {
      case "PENDING":
        return orders.filter((o) => o.status === "PENDING");
      case "active":
        return orders.filter((o) => ["CONFIRMED", "SHIPPED"].includes(o.status));
      case "done":
        return orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));
      default:
        return orders;
    }
  })();

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-extrabold text-gray-900">Objednávky</h1>

      <div className="overflow-x-auto -mx-4 px-4">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const firstItem = order.items[0];
            const date = new Date(order.createdAt);
            const isToday = new Date().toDateString() === date.toDateString();
            const dateStr = isToday
              ? `Dnes ${date.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}`
              : date.toLocaleDateString("cs-CZ");

            return (
              <OrderCard
                key={order.id}
                id={order.id}
                buyerName={order.deliveryName}
                itemName={firstItem?.part.name ?? "Díl"}
                quantity={firstItem?.quantity ?? 1}
                totalPrice={order.totalPrice}
                status={mapStatus(order.status)}
                date={dateStr}
                deliveryMethod=""
              />
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 font-medium">Žádné objednávky</p>
        </div>
      )}
    </div>
  );
}

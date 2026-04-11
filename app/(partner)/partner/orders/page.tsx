"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  part: { name: string; slug: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  deliveryName: string;
  createdAt: string;
  items: OrderItem[];
}

const statusBadge: Record<string, { label: string; variant: "new" | "pending" | "verified" | "rejected" | "default" }> = {
  PENDING: { label: "Nova", variant: "new" },
  CONFIRMED: { label: "Potvrzena", variant: "pending" },
  SHIPPED: { label: "Odeslano", variant: "verified" },
  DELIVERED: { label: "Doruceno", variant: "verified" },
  CANCELLED: { label: "Zrusena", variant: "rejected" },
};

export default function PartnerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?role=supplier&page=${page}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
        Objednavky
      </h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm h-24 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <EmptyState
            icon="📦"
            title="Zadne objednavky"
            description="Zatim nemate zadne objednavky v systemu."
          />
        </Card>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {orders.map((order) => {
              const badge = statusBadge[order.status] ?? statusBadge.PENDING;
              return (
                <Link key={order.id} href={`/partner/orders/${order.id}`} className="block no-underline">
                <Card className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-gray-500">
                          #{order.orderNumber}
                        </span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {order.deliveryName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {order.items.map((item) => `${item.part.name} x${item.quantity}`).join(", ")}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("cs-CZ")}
                      </div>
                    </div>
                    <div className="text-lg font-extrabold text-gray-900">
                      {formatPrice(order.totalPrice)}
                    </div>
                  </div>
                </Card>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

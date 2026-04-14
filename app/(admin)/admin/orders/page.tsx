"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  part: { name: string };
}

interface SubOrderRow {
  id: string;
  status: string;
  deliveryMethod: string;
  subtotal: number;
  trackingNumber: string | null;
  supplier: { companyName: string | null; firstName: string; lastName: string };
}

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  deliveryName: string;
  deliveryEmail: string;
  createdAt: string;
  items: OrderItem[];
  buyer: { firstName: string; lastName: string; email: string } | null;
  subOrders?: SubOrderRow[];
}

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_MAP: Record<string, { label: string; variant: "success" | "pending" | "rejected" }> = {
  PENDING: { label: "Nová", variant: "pending" },
  CONFIRMED: { label: "Potvrzená", variant: "success" },
  SHIPPED: { label: "Odesláno", variant: "success" },
  DELIVERED: { label: "Doručeno", variant: "success" },
  CANCELLED: { label: "Zrušená", variant: "rejected" },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Nová",
  CONFIRMED: "Potvrzená",
  SHIPPED: "Odesláno",
  DELIVERED: "Doručeno",
  CANCELLED: "Zrušená",
};

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  const { data: session } = useSession();
  const canChangeStatus = session?.user?.role === "ADMIN" || session?.user?.role === "BACKOFFICE" || session?.user?.role === "MANAGER";

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      fetchOrders();
    } catch {
      // ignore
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(amount);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900">Objednávky</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Objednávky</h1>
        </div>
        <div className="text-sm text-gray-500">{orders.length} objednávek</div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Hledat číslo objednávky, jméno nebo email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Všechny stavy</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left p-3 font-semibold text-gray-600">Objednávka</th>
                <th className="text-left p-3 font-semibold text-gray-600">Zákazník</th>
                <th className="text-left p-3 font-semibold text-gray-600">Položky</th>
                <th className="text-right p-3 font-semibold text-gray-600">Celkem</th>
                <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                <th className="text-left p-3 font-semibold text-gray-600">Datum</th>
                {canChangeStatus && <th className="text-left p-3 font-semibold text-gray-600">Akce</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canChangeStatus ? 7 : 6} className="p-8 text-center text-gray-400">
                    Načítám...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={canChangeStatus ? 7 : 6} className="p-8 text-center text-gray-400">
                    Žádné objednávky nenalezeny.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, variant: "pending" as const };
                  const hasSubOrders = order.subOrders && order.subOrders.length > 1;
                  const isExpanded = expanded.has(order.id);

                  return (
                    <><tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {hasSubOrders && (
                            <button
                              onClick={() => {
                                setExpanded((prev) => {
                                  const next = new Set(prev);
                                  next.has(order.id) ? next.delete(order.id) : next.add(order.id);
                                  return next;
                                });
                              }}
                              className="text-gray-400 hover:text-gray-600 text-xs mr-1"
                            >
                              {isExpanded ? "▼" : "▶"}
                            </button>
                          )}
                          <div className="font-medium text-gray-900">{order.orderNumber}</div>
                        </div>
                        {hasSubOrders && (
                          <div className="text-[10px] text-gray-400 ml-4">
                            {order.subOrders!.length} dodavatelů
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{order.deliveryName}</div>
                        <div className="text-xs text-gray-400">
                          {order.buyer
                            ? `${order.buyer.firstName} ${order.buyer.lastName}`
                            : order.deliveryEmail}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">
                        <div className="text-xs space-y-0.5">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id}>
                              {item.quantity}x {item.part.name}
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="text-gray-400">+{order.items.length - 3} dalších</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-900">
                        {formatPrice(order.totalPrice)}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString("cs-CZ")}
                      </td>
                      {canChangeStatus && (
                        <td className="p-3">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className="h-8 px-2 text-xs rounded border border-gray-200 bg-white"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                        </td>
                      )}
                    </tr>
                    {/* SubOrder detail rows */}
                    {isExpanded && hasSubOrders && order.subOrders!.map((so) => {
                      const soStatus = STATUS_MAP[so.status] || { label: so.status, variant: "pending" as const };
                      const soName = so.supplier.companyName ?? `${so.supplier.firstName} ${so.supplier.lastName}`;
                      return (
                        <tr key={so.id} className="bg-gray-50/50 border-b border-gray-50">
                          <td className="p-3 pl-8 text-xs text-gray-500" colSpan={2}>
                            <span className="font-medium text-gray-700">{soName}</span>
                            <span className="text-gray-400 ml-2">{so.deliveryMethod}</span>
                            {so.trackingNumber && <span className="text-orange-500 ml-2">{so.trackingNumber}</span>}
                          </td>
                          <td className="p-3 text-xs text-gray-500" />
                          <td className="p-3 text-right text-xs font-medium text-gray-600">
                            {formatPrice(so.subtotal)}
                          </td>
                          <td className="p-3">
                            <Badge variant={soStatus.variant}>{soStatus.label}</Badge>
                          </td>
                          <td className="p-3" />
                          {canChangeStatus && <td className="p-3" />}
                        </tr>
                      );
                    })}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

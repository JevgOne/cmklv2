"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface ReturnRow {
  id: string;
  type: string;
  status: string;
  reason: string;
  contactName: string;
  contactEmail: string;
  requestedAmount: number;
  approvedAmount: number | null;
  deadlineAt: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    deliveryName: string;
    totalPrice: number;
  };
}

const STATUSES = [
  "NEW", "RECEIVED", "IN_REVIEW", "APPROVED",
  "REFUNDED", "PARTIALLY_REFUNDED", "REJECTED", "CANCELLED",
];

const STATUS_MAP: Record<string, { label: string; variant: "success" | "pending" | "rejected" }> = {
  NEW: { label: "Nová", variant: "pending" },
  RECEIVED: { label: "Přijata", variant: "pending" },
  IN_REVIEW: { label: "Posuzování", variant: "pending" },
  APPROVED: { label: "Schválena", variant: "success" },
  REFUNDED: { label: "Vráceno", variant: "success" },
  PARTIALLY_REFUNDED: { label: "Částečně vráceno", variant: "success" },
  REJECTED: { label: "Zamítnuta", variant: "rejected" },
  CANCELLED: { label: "Zrušena", variant: "rejected" },
};

const TYPE_MAP: Record<string, string> = {
  WITHDRAWAL: "Odstoupení",
  WARRANTY: "Reklamace",
};

const TYPES = ["WITHDRAWAL", "WARRANTY"];

export const dynamic = "force-dynamic";

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (search) params.set("search", search);
    params.set("page", String(page));

    try {
      const res = await fetch(`/api/admin/returns?${params}`);
      const data = await res.json();
      if (data.returns) {
        setReturns(data.returns);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search, page]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, search]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(amount);

  const isOverdue = (deadlineAt: string | null) => {
    if (!deadlineAt) return false;
    return new Date(deadlineAt) < new Date();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900">Reklamace</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Reklamace a vrácení</h1>
        </div>
        <div className="text-sm text-gray-500">{total} reklamací celkem</div>
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Všechny typy</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_MAP[t]}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Všechny stavy</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_MAP[s]?.label || s}</option>
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
                <th className="text-left p-3 font-semibold text-gray-600">Typ</th>
                <th className="text-right p-3 font-semibold text-gray-600">Požadováno</th>
                <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                <th className="text-left p-3 font-semibold text-gray-600">Lhůta</th>
                <th className="text-left p-3 font-semibold text-gray-600">Datum</th>
                <th className="text-left p-3 font-semibold text-gray-600">Akce</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Načítám...
                  </td>
                </tr>
              ) : returns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Žádné reklamace nenalezeny.
                  </td>
                </tr>
              ) : (
                returns.map((ret) => {
                  const statusInfo = STATUS_MAP[ret.status] || { label: ret.status, variant: "pending" as const };
                  const overdue = isOverdue(ret.deadlineAt);

                  return (
                    <tr key={ret.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{ret.order.orderNumber}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{ret.contactName}</div>
                        <div className="text-xs text-gray-400">{ret.contactEmail}</div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ret.type === "WARRANTY"
                            ? "bg-red-50 text-red-700"
                            : "bg-blue-50 text-blue-700"
                        }`}>
                          {TYPE_MAP[ret.type] || ret.type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-900">
                        {formatPrice(ret.requestedAmount)}
                      </td>
                      <td className="p-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="p-3 text-xs">
                        {ret.deadlineAt ? (
                          <span className={overdue ? "text-red-600 font-semibold" : "text-gray-500"}>
                            {overdue && "⚠ "}
                            {new Date(ret.deadlineAt).toLocaleDateString("cs-CZ")}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(ret.createdAt).toLocaleDateString("cs-CZ")}
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/admin/returns/${ret.id}`}
                          className="text-orange-600 hover:text-orange-700 font-medium text-xs no-underline"
                        >
                          Detail →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Strana {page} z {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Předchozí
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Další →
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

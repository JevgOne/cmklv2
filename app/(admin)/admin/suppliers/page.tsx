"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface SupplierRow {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  _count: {
    suppliedParts: number;
    orderItemsAsSupplier: number;
  };
  totalPayout: number;
}

interface Stats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalParts: number;
  activeParts: number;
}

const SUPPLIER_ROLES = ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE"];

const ROLE_LABELS: Record<string, string> = {
  PARTS_SUPPLIER: "Dodavatel dílů",
  WHOLESALE_SUPPLIER: "Velkoobchod",
  PARTNER_VRAKOVISTE: "Vrakoviště",
};

const ROLE_COLORS: Record<string, string> = {
  PARTS_SUPPLIER: "bg-green-50 text-green-700",
  WHOLESALE_SUPPLIER: "bg-blue-50 text-blue-700",
  PARTNER_VRAKOVISTE: "bg-orange-50 text-orange-700",
};

const STATUS_MAP: Record<string, { label: string; variant: "success" | "pending" | "rejected" }> = {
  ACTIVE: { label: "Aktivní", variant: "success" },
  PENDING: { label: "Čekající", variant: "pending" },
  ONBOARDING: { label: "Onboarding", variant: "pending" },
  SUSPENDED: { label: "Pozastavený", variant: "rejected" },
  INACTIVE: { label: "Neaktivní", variant: "rejected" },
};

const STATUSES = ["ACTIVE", "PENDING", "ONBOARDING", "SUSPENDED", "INACTIVE"];

export const dynamic = "force-dynamic";

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    params.set("page", String(page));

    try {
      const res = await fetch(`/api/admin/suppliers?${params}`);
      const data = await res.json();
      if (data.suppliers) {
        setSuppliers(data.suppliers);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search, page]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, search]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(amount);

  const displayName = (s: SupplierRow) =>
    s.companyName || `${s.firstName} ${s.lastName}`;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900">Dodavatelé</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Dodavatelé</h1>
        </div>
        <div className="text-sm text-gray-500">{total} dodavatelů celkem</div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-5">
            <div className="text-xs font-medium text-gray-500 mb-1">Celkem dodavatelů</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalSuppliers}</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-medium text-gray-500 mb-1">Aktivních</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeSuppliers}</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-medium text-gray-500 mb-1">Celkem dílů</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalParts}</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-medium text-gray-500 mb-1">Aktivních dílů</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeParts}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Hledat jméno, firmu nebo email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Všechny role</option>
            {SUPPLIER_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
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
                <th className="text-left p-3 font-semibold text-gray-600">Dodavatel</th>
                <th className="text-left p-3 font-semibold text-gray-600">Role</th>
                <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                <th className="text-right p-3 font-semibold text-gray-600">Díly</th>
                <th className="text-right p-3 font-semibold text-gray-600">Objednávky</th>
                <th className="text-right p-3 font-semibold text-gray-600">Obrat</th>
                <th className="text-left p-3 font-semibold text-gray-600">Registrace</th>
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
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Žádní dodavatelé nenalezeni.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => {
                  const statusInfo = STATUS_MAP[supplier.status] || { label: supplier.status, variant: "pending" as const };
                  const roleColor = ROLE_COLORS[supplier.role] || "bg-gray-50 text-gray-700";

                  return (
                    <tr key={supplier.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{displayName(supplier)}</div>
                        <div className="text-xs text-gray-400">{supplier.email}</div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleColor}`}>
                          {ROLE_LABELS[supplier.role] || supplier.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="p-3 text-right font-medium text-gray-900">
                        {supplier._count.suppliedParts}
                      </td>
                      <td className="p-3 text-right font-medium text-gray-900">
                        {supplier._count.orderItemsAsSupplier}
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-900">
                        {formatPrice(supplier.totalPayout)}
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(supplier.createdAt).toLocaleDateString("cs-CZ")}
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/admin/users`}
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

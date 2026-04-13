"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface PartRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  partType: string;
  condition: string;
  status: string;
  price: number;
  stock: number;
  manufacturer: string | null;
  oemNumber: string | null;
  partNumber: string | null;
  viewCount: number;
  createdAt: string;
  supplier: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
  };
  images: { url: string }[];
}

const CATEGORIES = [
  { value: "ENGINE", label: "Motor" },
  { value: "TRANSMISSION", label: "Převodovka" },
  { value: "BRAKES", label: "Brzdy" },
  { value: "SUSPENSION", label: "Podvozek" },
  { value: "BODY", label: "Karoserie" },
  { value: "ELECTRICAL", label: "Elektro" },
  { value: "INTERIOR", label: "Interiér" },
  { value: "WHEELS", label: "Kola a pneumatiky" },
  { value: "EXHAUST", label: "Výfuk" },
  { value: "COOLING", label: "Chlazení" },
  { value: "FUEL", label: "Palivový systém" },
  { value: "OTHER", label: "Ostatní" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

const PART_TYPES = ["USED", "NEW", "AFTERMARKET"];
const TYPE_LABELS: Record<string, string> = {
  USED: "Použitý",
  NEW: "Nový",
  AFTERMARKET: "Aftermarket",
};

const STATUSES = ["DRAFT", "ACTIVE", "SOLD", "INACTIVE"];
const STATUS_MAP: Record<string, { label: string; variant: "success" | "pending" | "rejected" }> = {
  DRAFT: { label: "Koncept", variant: "pending" },
  ACTIVE: { label: "Aktivní", variant: "success" },
  SOLD: { label: "Prodáno", variant: "success" },
  INACTIVE: { label: "Neaktivní", variant: "rejected" },
};

export const dynamic = "force-dynamic";

export default function AdminPartsPage() {
  const { data: session } = useSession();
  const canBulkEdit = session?.user?.role === "ADMIN" || session?.user?.role === "BACKOFFICE";

  const [parts, setParts] = useState<PartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryFilter) params.set("category", categoryFilter);
    if (typeFilter) params.set("partType", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    params.set("page", String(page));

    try {
      const res = await fetch(`/api/admin/parts?${params}`);
      const data = await res.json();
      if (data.parts) {
        setParts(data.parts);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, typeFilter, statusFilter, search, page]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [categoryFilter, typeFilter, statusFilter, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === parts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(parts.map((p) => p.id)));
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) return;

    const label = status === "ACTIVE" ? "aktivovat" : "deaktivovat";
    if (!confirm(`Opravdu chcete ${label} ${selectedIds.size} dílů?`)) return;

    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/parts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), status }),
      });
      if (res.ok) {
        setSelectedIds(new Set());
        fetchParts();
      }
    } catch {
      // ignore
    } finally {
      setBulkLoading(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(amount);

  const supplierName = (s: PartRow["supplier"]) =>
    s.companyName || `${s.firstName} ${s.lastName}`;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900">Díly</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Správa dílů</h1>
        </div>
        <div className="text-sm text-gray-500">{total} dílů celkem</div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Hledat název, OEM, part number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Všechny kategorie</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="">Všechny typy</option>
            {PART_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
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

      {/* Bulk action bar */}
      {canBulkEdit && selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-orange-800">
            {selectedIds.size} {selectedIds.size === 1 ? "díl vybrán" : selectedIds.size < 5 ? "díly vybrány" : "dílů vybráno"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="success"
              onClick={() => bulkUpdateStatus("ACTIVE")}
              disabled={bulkLoading}
              className="text-xs px-3 py-1.5"
            >
              Aktivovat
            </Button>
            <Button
              variant="secondary"
              onClick={() => bulkUpdateStatus("INACTIVE")}
              disabled={bulkLoading}
              className="text-xs px-3 py-1.5"
            >
              Deaktivovat
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {canBulkEdit && (
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={parts.length > 0 && selectedIds.size === parts.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                  </th>
                )}
                <th className="text-left p-3 font-semibold text-gray-600 w-12">Foto</th>
                <th className="text-left p-3 font-semibold text-gray-600">Název</th>
                <th className="text-left p-3 font-semibold text-gray-600">Kategorie</th>
                <th className="text-left p-3 font-semibold text-gray-600">Typ</th>
                <th className="text-left p-3 font-semibold text-gray-600">Stav</th>
                <th className="text-right p-3 font-semibold text-gray-600">Cena</th>
                <th className="text-right p-3 font-semibold text-gray-600">Sklad</th>
                <th className="text-left p-3 font-semibold text-gray-600">Dodavatel</th>
                <th className="text-left p-3 font-semibold text-gray-600">Vytvořeno</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canBulkEdit ? 10 : 9} className="p-8 text-center text-gray-400">
                    Načítám...
                  </td>
                </tr>
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan={canBulkEdit ? 10 : 9} className="p-8 text-center text-gray-400">
                    Žádné díly nenalezeny.
                  </td>
                </tr>
              ) : (
                parts.map((part) => {
                  const statusInfo = STATUS_MAP[part.status] || { label: part.status, variant: "pending" as const };
                  const thumb = part.images[0]?.url;

                  return (
                    <tr key={part.id} className="border-b border-gray-50 hover:bg-gray-50">
                      {canBulkEdit && (
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(part.id)}
                            onChange={() => toggleSelect(part.id)}
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                        </td>
                      )}
                      <td className="p-3">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="w-10 h-10 rounded object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                            —
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/dily/${part.slug}`}
                          className="font-medium text-gray-900 hover:text-orange-600 max-w-[200px] truncate block no-underline"
                          target="_blank"
                        >
                          {part.name}
                        </Link>
                        {part.partNumber && (
                          <div className="text-xs text-gray-400 font-mono">{part.partNumber}</div>
                        )}
                      </td>
                      <td className="p-3 text-gray-600 text-xs">
                        {CATEGORY_MAP[part.category] || part.category}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {TYPE_LABELS[part.partType] || part.partType}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="p-3 text-right font-semibold text-gray-900">
                        {formatPrice(part.price)}
                      </td>
                      <td className="p-3 text-right">
                        <span className={part.stock === 0 ? "text-red-600 font-semibold" : "text-gray-900"}>
                          {part.stock}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-xs text-gray-600 max-w-[140px] truncate">
                          {supplierName(part.supplier)}
                        </div>
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {new Date(part.createdAt).toLocaleDateString("cs-CZ")}
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

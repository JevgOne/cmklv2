"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SeoStatusBadge } from "./SeoStatusBadge";
import { cn } from "@/lib/utils";

interface SeoPage {
  id: string;
  pagePath: string;
  pageType: string;
  section: string;
  title: string | null;
  description: string | null;
  canonical: string | null;
  noIndex: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  schemaTypesJson: string | null;
  auditStatus: string | null;
  auditNotes: string | null;
  lastAuditedAt: string | null;
  updatedAt: string;
}

const SECTIONS = ["vehicles", "parts", "blog", "stk", "services", "legal", "info", "marketplace", "brokers", "home", "listings"];
const PAGE_TYPES = ["STATIC", "DYNAMIC_LIST", "DYNAMIC_DETAIL", "LP"];
const STATUSES = ["OK", "WARNING", "ERROR", "unaudited"];

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function countSchemaTypes(json: string | null): number {
  if (!json) return 0;
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

// STOP-6: CSV export NESMÍ obsahovat interní ID
function exportCsv(pages: SeoPage[]) {
  const headers = ["pagePath", "pageType", "section", "title", "description", "canonical", "noIndex", "ogTitle", "ogDescription", "schemaTypes", "auditStatus", "lastAuditedAt"];
  const rows = pages.map((p) => [
    p.pagePath,
    p.pageType,
    p.section,
    p.title || "",
    p.description || "",
    p.canonical || "",
    String(p.noIndex),
    p.ogTitle || "",
    p.ogDescription || "",
    p.schemaTypesJson || "",
    p.auditStatus || "",
    p.lastAuditedAt || "",
  ]);

  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `seo-metadata-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SeoMetadataTable() {
  const router = useRouter();
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("pagePath");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Inline edit
  const [editingCell, setEditingCell] = useState<{ id: string; field: "title" | "description" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sort", sort);
      params.set("order", order);
      if (search) params.set("q", search);
      if (sectionFilter) params.set("section", sectionFilter);
      if (typeFilter) params.set("pageType", typeFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/seo/pages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
        setTotal(data.total || 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, sectionFilter, typeFilter, statusFilter, sort, order]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, sectionFilter, typeFilter, statusFilter]);

  const handleSort = (col: string) => {
    if (sort === col) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(col);
      setOrder("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === pages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pages.map((p) => p.id)));
    }
  };

  // STOP-7: noIndex override MUSÍ vyžadovat confirm dialog
  const handleBulkAction = async (action: string) => {
    if (selected.size === 0) return;

    if (action === "SET_NO_INDEX") {
      if (!confirm(`Opravdu chcete nastavit noIndex pro ${selected.size} stránek? Tyto stránky nebudou indexovány vyhledávači.`)) return;
    }
    if (action === "DELETE") {
      if (!confirm(`Opravdu chcete smazat overrides pro ${selected.size} stránek? Metadata se vrátí na výchozí hodnoty z kódu.`)) return;
    }

    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/seo/pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      if (res.ok) {
        setSelected(new Set());
        fetchPages();
      }
    } catch {
      // silent
    } finally {
      setBulkLoading(false);
    }
  };

  // Inline edit — STOP-5: debounce 500ms
  const startEdit = (id: string, field: "title" | "description", currentValue: string | null) => {
    setEditingCell({ id, field });
    setEditValue(currentValue || "");
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const saveEdit = useCallback(async () => {
    if (!editingCell) return;
    const { id, field } = editingCell;

    try {
      await fetch(`/api/admin/seo/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: editValue || null }),
      });
      setPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: editValue || null } : p))
      );
    } catch {
      // silent
    }
    setEditingCell(null);
  }, [editingCell, editValue]);

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  // STOP-5: debounced input
  const handleEditChange = (value: string) => {
    setEditValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const getCharColor = (len: number, max: number) => {
    if (len <= max) return "text-green-600";
    if (len <= max + 10) return "text-amber-600";
    return "text-red-600";
  };

  const SortHeader = ({ col, label }: { col: string; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 text-left text-xs font-bold text-gray-500 uppercase tracking-wide bg-transparent border-none cursor-pointer p-0 hover:text-gray-700"
    >
      {label}
      {sort === col && <span className="text-orange-500">{order === "asc" ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="w-full sm:w-auto sm:flex-1 max-w-xs">
          <Input
            placeholder="Hledat v cestě, titulku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-orange-500 focus:outline-none"
        >
          <option value="">Všechny sekce</option>
          {SECTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-orange-500 focus:outline-none"
        >
          <option value="">Všechny typy</option>
          {PAGE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-orange-500 focus:outline-none"
        >
          <option value="">Všechny statusy</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "unaudited" ? "Neauditováno" : s}</option>
          ))}
        </select>
      </div>

      {/* Bulk actions bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={pages.length > 0 && selected.size === pages.length}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 accent-orange-500"
          />
          Vybrat vše
        </label>
        <span className="text-sm text-gray-400">Vybrané: {selected.size}</span>
        {selected.size > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("MARK_OK")} disabled={bulkLoading}>
              Označit OK
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("SET_NO_INDEX")} disabled={bulkLoading}>
              Nastavit noIndex
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("REMOVE_NO_INDEX")} disabled={bulkLoading}>
              Odebrat noIndex
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleBulkAction("DELETE")} disabled={bulkLoading}>
              Smazat overrides
            </Button>
          </>
        )}
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={() => exportCsv(pages)}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            Žádné stránky k zobrazení
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-10 px-4 py-3.5 text-left bg-gray-50 border-b border-gray-200" />
                  <th className="px-4 py-3.5 text-left bg-gray-50 border-b border-gray-200">
                    <SortHeader col="auditStatus" label="Status" />
                  </th>
                  <th className="px-4 py-3.5 text-left bg-gray-50 border-b border-gray-200">
                    <SortHeader col="pagePath" label="Cesta" />
                  </th>
                  <th className="px-4 py-3.5 text-left bg-gray-50 border-b border-gray-200 hidden lg:table-cell">
                    <SortHeader col="title" label="Title" />
                  </th>
                  <th className="px-4 py-3.5 text-left bg-gray-50 border-b border-gray-200 hidden xl:table-cell">
                    Desc
                  </th>
                  <th className="px-4 py-3.5 text-left bg-gray-50 border-b border-gray-200 hidden md:table-cell">
                    OG
                  </th>
                  <th className="px-4 py-3.5 text-left bg-gray-50 border-b border-gray-200 hidden md:table-cell">
                    Schema
                  </th>
                  <th className="px-4 py-3.5 text-left bg-gray-50 border-b border-gray-200 hidden lg:table-cell">
                    <SortHeader col="updatedAt" label="Upraveno" />
                  </th>
                  <th className="px-4 py-3.5 text-left bg-gray-50 border-b border-gray-200">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody>
                {pages.map((p) => {
                  const titleLen = p.title?.length || 0;
                  const descLen = p.description?.length || 0;
                  const schemaCount = countSchemaTypes(p.schemaTypesJson);
                  const isEditingTitle = editingCell?.id === p.id && editingCell?.field === "title";
                  const isEditingDesc = editingCell?.id === p.id && editingCell?.field === "description";

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 border-b border-gray-100">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="w-4 h-4 rounded border-gray-300 accent-orange-500"
                        />
                      </td>
                      <td className="px-4 py-4 border-b border-gray-100">
                        <SeoStatusBadge status={p.auditStatus} />
                      </td>
                      <td className="px-4 py-4 border-b border-gray-100">
                        <div>
                          <button
                            onClick={() => router.push(`/admin/seo/metadata/${p.id}`)}
                            className="font-medium text-gray-900 hover:text-orange-600 transition-colors bg-transparent border-none cursor-pointer text-left text-sm p-0"
                          >
                            {p.pagePath}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-gray-400">{p.section}</span>
                            <span className="text-[11px] text-gray-300">·</span>
                            <span className="text-[11px] text-gray-400">{p.pageType}</span>
                            {p.noIndex && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">noindex</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 border-b border-gray-100 hidden lg:table-cell max-w-[200px]">
                        {isEditingTitle ? (
                          <div>
                            <textarea
                              ref={editRef}
                              value={editValue}
                              onChange={(e) => handleEditChange(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleEditKeyDown}
                              rows={2}
                              className="w-full px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
                            />
                            <span className={cn("text-[11px]", getCharColor(editValue.length, 60))}>
                              {editValue.length}/60
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(p.id, "title", p.title)}
                            className="text-left bg-transparent border-none cursor-pointer p-0 w-full group"
                            title={p.title || "Klikněte pro editaci"}
                          >
                            <span className="text-sm text-gray-700 truncate block group-hover:text-orange-600">
                              {p.title ? (p.title.length > 40 ? p.title.slice(0, 40) + "..." : p.title) : <span className="text-gray-300">—</span>}
                            </span>
                            {p.title && (
                              <span className={cn("text-[11px]", getCharColor(titleLen, 60))}>
                                {titleLen}ch
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4 border-b border-gray-100 hidden xl:table-cell">
                        {isEditingDesc ? (
                          <div>
                            <textarea
                              ref={editRef}
                              value={editValue}
                              onChange={(e) => handleEditChange(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleEditKeyDown}
                              rows={3}
                              className="w-full px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
                            />
                            <span className={cn("text-[11px]", getCharColor(editValue.length, 160))}>
                              {editValue.length}/160
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(p.id, "description", p.description)}
                            className="text-left bg-transparent border-none cursor-pointer p-0 w-full group"
                            title={p.description || "Klikněte pro editaci"}
                          >
                            {p.description ? (
                              <span className={cn("text-[11px]", getCharColor(descLen, 160))}>
                                {descLen}ch
                              </span>
                            ) : (
                              <span className="text-gray-300 text-sm">—</span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4 border-b border-gray-100 hidden md:table-cell">
                        {p.ogTitle ? (
                          <span className="text-green-600 text-sm" title={p.ogTitle}>&#10003;</span>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 border-b border-gray-100 hidden md:table-cell">
                        {schemaCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded">
                            {schemaCount}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-sm">0</span>
                        )}
                      </td>
                      <td className="px-4 py-4 border-b border-gray-100 hidden lg:table-cell">
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(p.updatedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/admin/seo/metadata/${p.id}`)}
                            className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            Editovat
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {total > limit && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit)}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

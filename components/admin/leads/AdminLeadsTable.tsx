"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";

interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  brand: string | null;
  model: string | null;
  city: string | null;
  status: string;
  source: string;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
  region: { id: string; name: string } | null;
}

interface StatusInfo {
  label: string;
  variant: "new" | "verified" | "pending" | "top" | "rejected" | "default";
}

interface AdminLeadsTableProps {
  leads: LeadRow[];
  statusLabels: Record<string, StatusInfo>;
}

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "Všechny stavy" },
  { value: "NEW", label: "Nové" },
  { value: "ASSIGNED", label: "Přijaté" },
  { value: "CONTACTED", label: "Kontaktováno" },
  { value: "MEETING_SCHEDULED", label: "Schůzka" },
  { value: "VEHICLE_ADDED", label: "Nabráno" },
  { value: "REJECTED", label: "Odmítnuté" },
  { value: "EXPIRED", label: "Expirované" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "Všechny zdroje" },
  { value: "WEB_FORM", label: "Webový formulář" },
  { value: "EXTERNAL_APP", label: "Externí app" },
  { value: "MANUAL", label: "Ručně" },
  { value: "REFERRAL", label: "Doporučení" },
];

export function AdminLeadsTable({ leads, statusLabels }: AdminLeadsTableProps) {
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter && lead.status !== statusFilter) return false;
      if (sourceFilter && lead.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchFields = [
          lead.name,
          lead.phone,
          lead.brand,
          lead.model,
          lead.city,
          lead.assignedTo?.name,
        ];
        if (!matchFields.some((f) => f?.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [leads, statusFilter, sourceFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filtry */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Hledat (jméno, telefon, auto, město...)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
          <Select
            options={SOURCE_OPTIONS}
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      {/* Tabulka */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wide">
                  Jméno
                </th>
                <th className="text-left px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Auto
                </th>
                <th className="text-left px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Město
                </th>
                <th className="text-left px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wide">
                  Stav
                </th>
                <th className="text-left px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Zdroj
                </th>
                <th className="text-left px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Makléř
                </th>
                <th className="text-left px-4 py-3 text-[13px] font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Žádné leady odpovídající filtrům
                  </td>
                </tr>
              )}
              {paginated.map((lead) => {
                const statusInfo = statusLabels[lead.status] ?? { label: lead.status, variant: "default" as const };
                return (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="no-underline"
                      >
                        <div className="font-semibold text-gray-900 text-sm">
                          {lead.name}
                        </div>
                        <div className="text-xs text-gray-400">{lead.phone}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                      {[lead.brand, lead.model].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                      {lead.city || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                      {lead.source === "WEB_FORM" ? "Web" : lead.source === "EXTERNAL_APP" ? "Externí" : lead.source === "MANUAL" ? "Ručně" : "Doporučení"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                      {lead.assignedTo ? (
                        <span className="font-medium">{lead.assignedTo.name}</span>
                      ) : (
                        <span className="text-gray-400">Nepřiřazeno</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 hidden sm:table-cell">
                      {new Date(lead.createdAt).toLocaleDateString("cs-CZ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stránkování */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <div className="text-center text-xs text-gray-400">
        Zobrazeno {paginated.length} z {filtered.length} leadů
      </div>
    </div>
  );
}

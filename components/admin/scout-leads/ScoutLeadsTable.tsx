"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScoutLeadStatusBadge } from "./ScoutLeadStatusBadge";

interface ScoutLead {
  id: string;
  category: string;
  country: string;
  source: string;
  name: string;
  phone: string | null;
  city: string | null;
  score: number;
  status: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  linkedRegion: { id: string; name: string } | null;
  completenessScore: number | null;
  createdAt: string;
}

function CompletenessGradeBadge({ score }: { score: number | null }) {
  const { grade, color } = (() => {
    if (score == null || score === 0) return { grade: "?", color: "bg-gray-100 text-gray-400" };
    if (score >= 90) return { grade: "A", color: "bg-green-100 text-green-700" };
    if (score >= 70) return { grade: "B", color: "bg-blue-100 text-blue-700" };
    if (score >= 50) return { grade: "C", color: "bg-orange-100 text-orange-700" };
    if (score >= 30) return { grade: "D", color: "bg-red-100 text-red-600" };
    return { grade: "F", color: "bg-red-200 text-red-800" };
  })();
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${color}`}>
      {grade}
    </span>
  );
}

const categoryTabs = [
  { value: "ALL", label: "Vše" },
  { value: "VRAKOVISTE", label: "Vrakoviště" },
  { value: "AUTOBAZAR", label: "Autobazary" },
  { value: "SOUKROMNIK", label: "Soukromníci" },
];

const countryOptions = [
  { value: "", label: "Všechny země" },
  { value: "CZ", label: "Česko" },
  { value: "SK", label: "Slovensko" },
  { value: "DE", label: "Německo" },
  { value: "AT", label: "Rakousko" },
];

const statusOptions = [
  { value: "", label: "Všechny stavy" },
  { value: "NEW", label: "Nový" },
  { value: "CONTACTED", label: "Kontaktován" },
  { value: "QUALIFIED", label: "Kvalifikován" },
  { value: "REJECTED", label: "Odmítnut" },
  { value: "WON", label: "Konvertován" },
  { value: "LOST", label: "Ztracen" },
];

const sourceOptions = [
  { value: "", label: "Všechny zdroje" },
  { value: "GOOGLE_PLACES", label: "Google Places" },
  { value: "ARES", label: "ARES" },
  { value: "FIRMY_CZ", label: "Firmy.cz" },
  { value: "ZLATESTRANKY", label: "Zlaté stránky" },
  { value: "BAZOS", label: "Bazoš" },
  { value: "SBAZAR", label: "Sbazar" },
  { value: "SAUTO", label: "Sauto" },
  { value: "TIPCARS", label: "TipCars" },
  { value: "MOBILE_DE", label: "Mobile.de" },
  { value: "AUTOSCOUT24", label: "AutoScout24" },
  { value: "MANUAL", label: "Manuální" },
];

const categoryLabels: Record<string, string> = {
  VRAKOVISTE: "Vrakoviště",
  AUTOBAZAR: "Autobazar",
  SOUKROMNIK: "Soukromník",
};

const sourceLabels: Record<string, string> = {
  GOOGLE_PLACES: "Google",
  ARES: "ARES",
  FIRMY_CZ: "Firmy.cz",
  ZLATESTRANKY: "Zlaté str.",
  BAZOS: "Bazoš",
  SBAZAR: "Sbazar",
  SAUTO: "Sauto",
  TIPCARS: "TipCars",
  MOBILE_DE: "Mobile.de",
  AUTOSCOUT24: "AutoScout",
  MANUAL: "Manuální",
  HANDELSREGISTER: "Handelsreg.",
};

export function ScoutLeadsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<ScoutLead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const initialCategory = searchParams.get("category") || "ALL";
  const [category, setCategory] = useState(initialCategory);
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "ALL") params.set("category", category);
      if (country) params.set("country", country);
      if (status) params.set("status", status);
      if (source) params.set("source", source);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "20");

      try {
        const res = await fetch(`/api/scout-leads?${params}`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error("Failed to fetch scout leads:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, [category, country, status, source, search, page]);

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <Tabs
        tabs={categoryTabs}
        activeTab={category}
        onTabChange={(val) => {
          setCategory(val);
          setPage(1);
        }}
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setPage(1);
            }}
            options={countryOptions}
            placeholder="Země"
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            options={statusOptions}
            placeholder="Stav"
          />
          <Select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            options={sourceOptions}
            placeholder="Zdroj"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Hledat..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
          <div className="flex items-center text-sm text-gray-500 px-2">
            Celkem: {total}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Načítám...</div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Žádné scout leady"
            description="Zatím nemáme žádné automaticky nalezené leady."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">
                    Název
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden lg:table-cell">
                    Kategorie
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">
                    Město
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">
                    Zdroj
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">
                    Score
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">
                    Kompletnost
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">
                    Stav
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden lg:table-cell">
                    Přiřazeno
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden lg:table-cell">
                    Datum
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(`/admin/scout-leads/${lead.id}`)
                    }
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">
                        {lead.name}
                      </div>
                      {lead.phone && (
                        <div className="text-xs text-gray-400">
                          {lead.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                          {lead.country}
                        </span>
                        {categoryLabels[lead.category] || lead.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                      {lead.city || "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                      {sourceLabels[lead.source] || lead.source}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="font-bold text-orange-500">
                        {lead.score}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <CompletenessGradeBadge score={lead.completenessScore} />
                    </td>
                    <td className="py-3 px-4">
                      <ScoutLeadStatusBadge status={lead.status} />
                    </td>
                    <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">
                      {lead.assignedTo
                        ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs hidden lg:table-cell">
                      {new Date(lead.createdAt).toLocaleDateString(
                        "cs-CZ"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

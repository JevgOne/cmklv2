"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { PartnerStatusBadge } from "./PartnerStatusBadge";

interface Partner {
  id: string;
  name: string;
  type: string;
  city: string | null;
  region: string | null;
  estimatedSize: string | null;
  status: string;
  score: number;
  phone: string | null;
  email: string | null;
  manager: { id: string; firstName: string; lastName: string } | null;
  _count: { activities: number; leads: number };
  createdAt: string;
  updatedAt: string;
}

interface PartnersTableProps {
  initialType?: string;
}

const typeTabs = [
  { value: "ALL", label: "Všichni" },
  { value: "AUTOBAZAR", label: "Autobazary" },
  { value: "VRAKOVISTE", label: "Vrakoviště" },
];

const statusOptions = [
  { value: "", label: "Všechny stavy" },
  { value: "NEOSLOVENY", label: "Neoslovený" },
  { value: "PRIRAZENY", label: "Přiřazený" },
  { value: "OSLOVEN", label: "Oslovený" },
  { value: "JEDNAME", label: "Jednáme" },
  { value: "AKTIVNI_PARTNER", label: "Aktivní partner" },
  { value: "ODMITNUTO", label: "Odmítnuto" },
  { value: "POZASTAVENO", label: "Pozastaveno" },
];

const sizeOptions = [
  { value: "", label: "Všechny velikosti" },
  { value: "SMALL", label: "Malý (< 20 aut)" },
  { value: "MEDIUM", label: "Střední (20-100 aut)" },
  { value: "LARGE", label: "Velký (100+ aut)" },
];

export function PartnersTable({ initialType }: PartnersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState(initialType || searchParams.get("type") || "ALL");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [size, setSize] = useState(searchParams.get("size") || "");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchPartners() {
      setLoading(true);
      const params = new URLSearchParams();
      if (type !== "ALL") params.set("type", type);
      if (status) params.set("status", status);
      if (size) params.set("size", size);
      params.set("page", String(page));
      params.set("limit", "20");

      try {
        const res = await fetch(`/api/partners?${params}`);
        if (res.ok) {
          const data = await res.json();
          setPartners(data.partners);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error("Failed to fetch partners:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPartners();
  }, [type, status, size, page]);

  return (
    <div className="space-y-6">
      {/* Type tabs */}
      <Tabs
        tabs={typeTabs}
        activeTab={type}
        onTabChange={(val) => {
          setType(val);
          setPage(1);
        }}
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            value={size}
            onChange={(e) => {
              setSize(e.target.value);
              setPage(1);
            }}
            options={sizeOptions}
            placeholder="Velikost"
          />
          <div className="flex items-center text-sm text-gray-500 px-4">
            Celkem: {total} partnerů
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Načítám...</div>
        ) : partners.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="Žádní partneři"
            description="Zatím nemáme žádné partnery v systému."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Název</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Typ</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Město</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Manažer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Stav</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Score</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr
                    key={partner.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/partners/${partner.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{partner.name}</div>
                      {partner.phone && (
                        <div className="text-xs text-gray-400">{partner.phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {partner.type === "AUTOBAZAR" ? "Autobazar" : "Vrakoviště"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{partner.city || "—"}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {partner.manager
                        ? `${partner.manager.firstName} ${partner.manager.lastName}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <PartnerStatusBadge status={partner.status} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-orange-500">{partner.score}</span>
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

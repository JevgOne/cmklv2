"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";

interface PartnerLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  vehicle: { id: string; brand: string; model: string; year: number } | null;
}

const statusTabs = [
  { value: "", label: "Vsichni" },
  { value: "NOVY", label: "Novi" },
  { value: "KONTAKTOVAN", label: "Kontaktovani" },
  { value: "DOMLUVENO", label: "Domluveno" },
  { value: "PRODANO", label: "Prodano" },
  { value: "NEZAJEM", label: "Nezajem" },
];

const statusVariants: Record<string, "new" | "pending" | "verified" | "top" | "rejected" | "default"> = {
  NOVY: "new",
  KONTAKTOVAN: "pending",
  DOMLUVENO: "top",
  PRODANO: "verified",
  NEZAJEM: "rejected",
};

export default function PartnerLeadsPage() {
  const [leads, setLeads] = useState<PartnerLead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page));

      try {
        const res = await fetch(`/api/partner/leads?${params}`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error("Failed to load leads:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status, page]);

  async function updateLeadStatus(leadId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/partner/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
      }
    } catch (err) {
      console.error("Failed to update lead:", err);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Zajemci</h1>

      <Tabs
        tabs={statusTabs}
        activeTab={status}
        onTabChange={(val) => { setStatus(val); setPage(1); }}
        className="mb-6"
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm h-20 animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Zadni zajemci"
          description="Zatim se nikdo neozval."
        />
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {leads.map((lead) => (
              <Card key={lead.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{lead.name}</span>
                      <Badge variant={statusVariants[lead.status] || "default"}>
                        {lead.status}
                      </Badge>
                    </div>
                    {lead.vehicle && (
                      <div className="text-sm text-gray-500">
                        {lead.vehicle.brand} {lead.vehicle.model} ({lead.vehicle.year})
                      </div>
                    )}
                    {lead.message && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {lead.message}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      {lead.phone && <span>📞 {lead.phone}</span>}
                      {lead.email && <span>📧 {lead.email}</span>}
                      <span>{new Date(lead.createdAt).toLocaleDateString("cs-CZ")}</span>
                    </div>
                  </div>
                  <div>
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="NOVY">Novy</option>
                      <option value="KONTAKTOVAN">Kontaktovan</option>
                      <option value="DOMLUVENO">Domluveno</option>
                      <option value="PRODANO">Prodano</option>
                      <option value="NEZAJEM">Nezajem</option>
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface LeadSummary {
  id: string;
  name: string;
  phone: string;
  brand: string | null;
  model: string | null;
  city: string | null;
  createdAt: string;
}

export function NewLeadsSection() {
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingLeadId, setRejectingLeadId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function fetchLeads() {
    try {
      const res = await fetch("/api/leads?status=NEW&assignedToId=me");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? data ?? []);
      }
    } catch {
      // API ještě nemusí existovat
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  async function handleAccept(leadId: string) {
    setActionLoading(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ASSIGNED" }),
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
      }
    } catch {
      // chyba
    } finally {
      setActionLoading(null);
    }
  }

  function handleRejectOpen(leadId: string) {
    setRejectingLeadId(leadId);
    setRejectReason("");
  }

  async function handleRejectConfirm() {
    if (!rejectingLeadId || !rejectReason.trim()) return;

    setActionLoading(rejectingLeadId);
    try {
      const res = await fetch(`/api/leads/${rejectingLeadId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", rejectionReason: rejectReason.trim() }),
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== rejectingLeadId));
      }
    } catch {
      // chyba
    } finally {
      setActionLoading(null);
      setRejectingLeadId(null);
      setRejectReason("");
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
          Nové leady
        </h3>
        <Badge variant="rejected">{leads.length}</Badge>
      </div>

      {leads.map((lead) => (
        <Card key={lead.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/makler/leads/${lead.id}`}
              className="flex-1 no-underline"
            >
              <div className="font-semibold text-gray-900 text-sm">
                {lead.name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {[
                  lead.brand && lead.model
                    ? `${lead.brand} ${lead.model}`
                    : lead.brand,
                  lead.city,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                <a
                  href={`tel:${lead.phone}`}
                  className="text-orange-500 font-medium no-underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {lead.phone}
                </a>
              </div>
            </Link>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="success"
                size="sm"
                disabled={actionLoading === lead.id}
                onClick={() => handleAccept(lead.id)}
              >
                Přijmout
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={actionLoading === lead.id}
                onClick={() => handleRejectOpen(lead.id)}
              >
                Odmítnout
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {leads.length > 0 && (
        <Link
          href="/makler/leads"
          className="block text-center text-sm text-orange-500 font-semibold py-2 no-underline"
        >
          Zobrazit vše ({leads.length})
        </Link>
      )}

      {/* Reject modal */}
      {rejectingLeadId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setRejectingLeadId(null)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900 mb-3">Důvod odmítnutí</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Proč lead odmítáte?"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setRejectingLeadId(null)}
              >
                Zrušit
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                disabled={!rejectReason.trim() || actionLoading === rejectingLeadId}
                onClick={handleRejectConfirm}
              >
                Odmitnout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

  async function fetchLeads() {
    try {
      const res = await fetch("/api/leads?status=NEW&assignedToId=me");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? data ?? []);
      }
    } catch {
      // API jeste nemusi existovat
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

  async function handleReject(leadId: string) {
    const reason = prompt("Duvod odmitnuti:");
    if (!reason) return;

    setActionLoading(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", rejectionReason: reason }),
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
          Nove leady
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
                Prijmout
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={actionLoading === lead.id}
                onClick={() => handleReject(lead.id)}
              >
                Odmit
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
          Zobrazit vse ({leads.length})
        </Link>
      )}
    </div>
  );
}

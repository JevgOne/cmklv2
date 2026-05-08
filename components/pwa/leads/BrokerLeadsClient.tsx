"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { LeadCard, LeadCardData } from "@/components/pwa/leads/LeadCard";
import { EmptyState } from "@/components/ui/EmptyState";

const LEAD_TABS = [
  { value: "NEW", label: "Nové" },
  { value: "ASSIGNED", label: "Přijaté" },
  { value: "CONTACTED", label: "Kontaktováno" },
  { value: "MEETING_SCHEDULED", label: "Schůzka" },
  { value: "REJECTED", label: "Odmítnuté" },
];

interface BrokerLeadsClientProps {
  initialLeads: LeadCardData[];
}

export function BrokerLeadsClient({ initialLeads }: BrokerLeadsClientProps) {
  const [activeTab, setActiveTab] = useState("NEW");
  const [leads, setLeads] = useState<LeadCardData[]>(initialLeads);
  const [loading, setLoading] = useState(false);
  const isInitial = useRef(true);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    async function fetchLeads() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leads?status=${activeTab}&assignedToId=me`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads ?? data ?? []);
        } else {
          setLeads([]);
        }
      } catch {
        setLeads([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, [activeTab]);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Leady</h1>
        <p className="text-sm text-gray-500 mt-1">
          Přehled vašich přiřazených leadů
        </p>
      </div>

      <Tabs
        tabs={LEAD_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="overflow-x-auto"
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Žádné leady"
          description={`V kategorii "${LEAD_TABS.find((t) => t.value === activeTab)?.label}" nemáte žádné leady.`}
        />
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

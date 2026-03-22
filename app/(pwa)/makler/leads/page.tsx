"use client";

import { useEffect, useState, useCallback } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { LeadCard, LeadCardData } from "@/components/pwa/leads/LeadCard";
import { EmptyState } from "@/components/ui/EmptyState";

const LEAD_TABS = [
  { value: "NEW", label: "Nove" },
  { value: "ASSIGNED", label: "Prijate" },
  { value: "CONTACTED", label: "Kontaktovano" },
  { value: "MEETING_SCHEDULED", label: "Schuzka" },
  { value: "REJECTED", label: "Odmitnute" },
];

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState("NEW");
  const [leads, setLeads] = useState<LeadCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads?status=${status}&assignedToId=me`);
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
  }, []);

  useEffect(() => {
    fetchLeads(activeTab);
  }, [activeTab, fetchLeads]);

  function handleTabChange(value: string) {
    setActiveTab(value);
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Leady</h1>
        <p className="text-sm text-gray-500 mt-1">
          Prehled vasich prirazenych leadu
        </p>
      </div>

      <Tabs
        tabs={LEAD_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
          title="Zadne leady"
          description={`V kategorii "${LEAD_TABS.find((t) => t.value === activeTab)?.label}" nemáte zadne leady.`}
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

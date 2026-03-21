"use client";

import { useState, useEffect } from "react";
import { Button, Tabs, Pagination, StatusPill, Card } from "@/components/ui";
import { DataTable } from "@/components/admin/DataTable";

interface Broker {
  id: string;
  name: string;
  email: string;
  initials: string;
  region: string;
  vehicles: number;
  status: "active" | "pending" | "rejected";
  createdAt: string;
}

const statusLabels: Record<Broker["status"], string> = {
  active: "Aktivní",
  pending: "Čekající",
  rejected: "Zamítnutý",
};

function TableActions() {
  return (
    <div className="flex items-center gap-1.5">
      <button
        className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-[10px] text-sm cursor-pointer transition-colors hover:bg-gray-200 border-none"
        title="Zobrazit"
        onClick={() => alert("Detail makléře bude brzy dostupný.")}
      >
        👁
      </button>
      <button
        className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-[10px] text-sm cursor-pointer transition-colors hover:bg-gray-200 border-none"
        title="Upravit"
        onClick={() => alert("Úprava makléře bude brzy dostupná.")}
      >
        ✏️
      </button>
      <button
        className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-[10px] text-sm cursor-pointer transition-colors hover:bg-error-50 hover:text-error-500 border-none"
        title="Smazat"
        onClick={() => {
          if (confirm("Opravdu chcete smazat tohoto makléře?")) {
            alert("Smazání makléře bude brzy dostupné.");
          }
        }}
      >
        🗑
      </button>
    </div>
  );
}

const columns = [
  {
    key: "broker",
    header: "Makléř",
    render: (item: Broker) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
          {item.initials}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{item.name}</div>
          <div className="text-xs text-gray-500">{item.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: "region",
    header: "Region",
    render: (item: Broker) => item.region,
  },
  {
    key: "vehicles",
    header: "Vozidla",
    render: (item: Broker) => item.vehicles,
  },
  {
    key: "status",
    header: "Status",
    render: (item: Broker) => (
      <StatusPill variant={item.status}>{statusLabels[item.status]}</StatusPill>
    ),
  },
  {
    key: "actions",
    header: "Akce",
    render: () => <TableActions />,
  },
];

export function BrokersPageContent() {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrokers() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/brokers");
        if (res.ok) {
          const data = await res.json();
          setBrokers(data.brokers);
        }
      } catch (err) {
        console.error("Chyba při načítání makléřů:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBrokers();
  }, []);

  const filteredBrokers =
    activeTab === "all"
      ? brokers
      : brokers.filter((b) => b.status === activeTab);

  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredBrokers.length / perPage));
  const paginatedBrokers = filteredBrokers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const activeCnt = brokers.filter((b) => b.status === "active").length;
  const pendingCnt = brokers.filter((b) => b.status === "pending").length;
  const rejectedCnt = brokers.filter((b) => b.status === "rejected").length;

  const tabs = [
    { value: "all", label: `Všichni (${brokers.length})` },
    { value: "active", label: `Aktivní (${activeCnt})` },
    { value: "pending", label: `Čekající (${pendingCnt})` },
    { value: "rejected", label: `Zamítnutí (${rejectedCnt})` },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-sm text-gray-500 mb-1">Admin / Makléři</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Makléři</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => alert("Export makléřů bude brzy dostupný.")}>
              Exportovat
            </Button>
            <Button variant="primary" size="sm" onClick={() => alert("Přidání makléře bude brzy dostupné.")}>
              Přidat makléře
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(t) => {
          setActiveTab(t);
          setCurrentPage(1);
        }}
      />

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            Načítám makléře...
          </div>
        ) : paginatedBrokers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Žádní makléři k zobrazení.
          </div>
        ) : (
          <DataTable columns={columns} data={paginatedBrokers} />
        )}
      </Card>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

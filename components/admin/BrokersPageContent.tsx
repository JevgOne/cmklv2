"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Tabs, Pagination, StatusPill, Card } from "@/components/ui";
import { DataTable } from "@/components/admin/DataTable";
import { InviteBrokerModal } from "@/components/admin/InviteBrokerModal";
import { BrokerApprovalCard } from "@/components/admin/BrokerApprovalCard";

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

interface OnboardingBroker {
  id: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
  avatar?: string | null;
  ico?: string;
  bio?: string;
  specializations: string[];
  cities: string[];
  quizScore?: number;
  quizTotal?: number;
  documentsUploaded: boolean;
  contractSigned: boolean;
  onboardingStep: string;
  createdAt: string;
}

const statusLabels: Record<Broker["status"], string> = {
  active: "Aktivní",
  pending: "Čekající",
  rejected: "Zamítnutý",
};

function TableActions({ brokerId }: { brokerId: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`/admin/brokers/${brokerId}`}
        className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-[10px] text-sm cursor-pointer transition-colors hover:bg-gray-200 border-none no-underline"
        title="Zobrazit"
      >
        👁
      </a>
      <a
        href={`/admin/brokers/${brokerId}/edit`}
        className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-[10px] text-sm cursor-pointer transition-colors hover:bg-gray-200 border-none no-underline"
        title="Upravit"
      >
        ✏️
      </a>
      <button
        className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-[10px] text-sm cursor-pointer transition-colors hover:bg-error-50 hover:text-error-500 border-none"
        title="Smazat"
        disabled
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
    render: (item: Broker) => <TableActions brokerId={item.id} />,
  },
];

export function BrokersPageContent() {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [onboardingBrokers, setOnboardingBrokers] = useState<OnboardingBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const fetchBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brokers");
      if (res.ok) {
        const data = await res.json();
        setBrokers(data.brokers || []);
        setOnboardingBrokers(data.onboardingBrokers || []);
      }
    } catch (err) {
      console.error("Chyba při načítání makléřů:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrokers();
  }, [fetchBrokers]);

  const filteredBrokers =
    activeTab === "all"
      ? brokers
      : activeTab === "onboarding"
        ? [] // Onboarding tab shows cards, not table
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
    { value: "onboarding", label: `Onboarding (${onboardingBrokers.length})` },
    { value: "pending", label: `Čekající (${pendingCnt})` },
    { value: "rejected", label: `Zamítnutí (${rejectedCnt})` },
  ];

  const handleBrokerActivated = (id: string) => {
    setOnboardingBrokers((prev) => prev.filter((b) => b.id !== id));
    fetchBrokers();
  };

  const handleBrokerRejected = (id: string) => {
    setOnboardingBrokers((prev) => prev.filter((b) => b.id !== id));
    fetchBrokers();
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-sm text-gray-500 mb-1">Admin / Makléři</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Makléři</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" disabled>
              Exportovat
            </Button>
            <Button variant="primary" size="sm" onClick={() => setInviteModalOpen(true)}>
              Pozvat makléře
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

      {/* Content */}
      {activeTab === "onboarding" ? (
        // Onboarding tab - show approval cards
        <div>
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              Načítám makléře...
            </div>
          ) : onboardingBrokers.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              Žádní makléři v onboardingu.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {onboardingBrokers.map((broker) => (
                <BrokerApprovalCard
                  key={broker.id}
                  broker={broker}
                  onActivate={handleBrokerActivated}
                  onReject={handleBrokerRejected}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
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
        </>
      )}

      {/* Invite modal */}
      <InviteBrokerModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={fetchBrokers}
      />
    </div>
  );
}

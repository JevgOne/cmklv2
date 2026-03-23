"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, StatusPill, Tabs } from "@/components/ui";
import { DataTable } from "@/components/admin/DataTable";
import { InviteBrokerModal } from "@/components/admin/InviteBrokerModal";

interface BrokerData {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  avatar: string | null;
  status: string;
  activeVehicles: number;
  sales: number;
  totalCommission: number;
  region: string;
  createdAt: string;
}

interface ManagerBrokersContentProps {
  brokers: BrokerData[];
}

const statusMap: Record<string, { label: string; variant: "active" | "pending" | "rejected" }> = {
  ACTIVE: { label: "Aktivní", variant: "active" },
  PENDING: { label: "Čekající", variant: "pending" },
  ONBOARDING: { label: "Onboarding", variant: "pending" },
  SUSPENDED: { label: "Pozastaven", variant: "rejected" },
  INACTIVE: { label: "Neaktivní", variant: "rejected" },
};

export function ManagerBrokersContent({ brokers }: ManagerBrokersContentProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const activeBrokers = brokers.filter((b) => b.status === "ACTIVE");
  const onboardingBrokers = brokers.filter(
    (b) => b.status === "ONBOARDING" || b.status === "PENDING"
  );
  const inactiveBrokers = brokers.filter(
    (b) => b.status === "SUSPENDED" || b.status === "INACTIVE"
  );

  const tabs = [
    { value: "all", label: `Všichni (${brokers.length})` },
    { value: "active", label: `Aktivní (${activeBrokers.length})` },
    { value: "onboarding", label: `Onboarding (${onboardingBrokers.length})` },
    { value: "inactive", label: `Neaktivní (${inactiveBrokers.length})` },
  ];

  const filteredBrokers =
    activeTab === "all"
      ? brokers
      : activeTab === "active"
        ? activeBrokers
        : activeTab === "onboarding"
          ? onboardingBrokers
          : inactiveBrokers;

  const columns = [
    {
      key: "broker",
      header: "Makléř",
      render: (item: BrokerData) => (
        <Link
          href={`/admin/manager/brokers/${item.id}`}
          className="flex items-center gap-3 no-underline"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
            {item.initials}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{item.name}</div>
            <div className="text-xs text-gray-500">{item.email}</div>
          </div>
        </Link>
      ),
    },
    {
      key: "phone",
      header: "Telefon",
      render: (item: BrokerData) => (
        <span className="text-sm text-gray-700">{item.phone || "—"}</span>
      ),
    },
    {
      key: "vehicles",
      header: "Aktivní auta",
      render: (item: BrokerData) => (
        <span className="text-sm font-semibold text-gray-900">
          {item.activeVehicles}
        </span>
      ),
    },
    {
      key: "sales",
      header: "Prodeje",
      render: (item: BrokerData) => (
        <span className="text-sm text-gray-700">{item.sales}</span>
      ),
    },
    {
      key: "commission",
      header: "Provize",
      render: (item: BrokerData) => (
        <span className="text-sm font-semibold text-gray-900">
          {item.totalCommission.toLocaleString("cs-CZ")} Kč
        </span>
      ),
    },
    {
      key: "status",
      header: "Stav",
      render: (item: BrokerData) => {
        const s = statusMap[item.status] || { label: item.status, variant: "pending" as const };
        return <StatusPill variant={s.variant}>{s.label}</StatusPill>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (item: BrokerData) => (
        <Link
          href={`/admin/manager/brokers/${item.id}`}
          className="text-sm text-orange-500 font-semibold hover:underline no-underline"
        >
          Detail
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t)}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => setInviteModalOpen(true)}
        >
          Pozvat makléře
        </Button>
      </div>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        {filteredBrokers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Žádní makléři k zobrazení.
          </div>
        ) : (
          <DataTable columns={columns} data={filteredBrokers} />
        )}
      </Card>

      {/* Invite modal */}
      <InviteBrokerModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
}

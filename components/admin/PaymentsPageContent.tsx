"use client";

import { useState, useEffect } from "react";
import { Card, Button, Tabs, StatusPill, EmptyState } from "@/components/ui";
import { DataTable } from "@/components/admin/DataTable";

interface Payment {
  id: string;
  vehicleName: string;
  vehicleSlug: string | null;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  method: string;
  status: string;
  variableSymbol: string | null;
  brokerName: string | null;
  confirmedByName: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

const methodLabels: Record<string, string> = {
  CARD: "Kartou",
  BANK_TRANSFER: "Převodem",
  FINANCING: "Financování",
};

const statusConfig: Record<string, { label: string; variant: "active" | "pending" | "rejected" | "sold" | "draft" }> = {
  PENDING: { label: "Čeká", variant: "pending" },
  PROCESSING: { label: "Zpracovává se", variant: "pending" },
  PAID: { label: "Zaplaceno", variant: "active" },
  FAILED: { label: "Selhala", variant: "rejected" },
  REFUNDED: { label: "Vráceno", variant: "draft" },
};

const columns = [
  {
    key: "vehicle",
    header: "Vozidlo",
    render: (p: Payment) => (
      <span className="font-medium text-gray-900">{p.vehicleName}</span>
    ),
  },
  {
    key: "buyer",
    header: "Kupující",
    render: (p: Payment) => (
      <div>
        <div className="text-sm font-medium text-gray-900">{p.buyerName}</div>
        <div className="text-xs text-gray-500">{p.buyerEmail}</div>
      </div>
    ),
  },
  {
    key: "amount",
    header: "Částka",
    render: (p: Payment) => (
      <span className="font-semibold text-gray-900">
        {p.amount.toLocaleString("cs-CZ")} Kč
      </span>
    ),
  },
  {
    key: "method",
    header: "Metoda",
    className: "hidden md:table-cell",
    render: (p: Payment) => (
      <span className="text-sm text-gray-700">
        {methodLabels[p.method] || p.method}
      </span>
    ),
  },
  {
    key: "status",
    header: "Stav",
    render: (p: Payment) => {
      const config = statusConfig[p.status] || { label: p.status, variant: "draft" as const };
      return <StatusPill variant={config.variant}>{config.label}</StatusPill>;
    },
  },
  {
    key: "vs",
    header: "VS",
    className: "hidden md:table-cell",
    render: (p: Payment) => (
      <span className="text-xs font-mono text-gray-500">
        {p.variableSymbol || "-"}
      </span>
    ),
  },
  {
    key: "date",
    header: "Datum",
    className: "hidden md:table-cell",
    render: (p: Payment) => (
      <span className="text-sm text-gray-500">
        {new Date(p.createdAt).toLocaleDateString("cs-CZ")}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Akce",
    render: (p: Payment) => <PaymentActions payment={p} />,
  },
];

function PaymentActions({ payment }: { payment: Payment }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (payment.status !== "PENDING" || payment.method === "CARD") {
    return (
      <span className="text-xs text-gray-400">
        {payment.confirmedByName
          ? `Potvrdil: ${payment.confirmedByName}`
          : "-"}
      </span>
    );
  }

  async function handleConfirm() {
    if (!confirm("Opravdu chcete potvrdit přijetí platby?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/payments/${payment.id}/confirm`, {
        method: "PUT",
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Chyba při potvrzování");
      }
    } catch {
      setError("Nastala chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button size="sm" variant="success" onClick={handleConfirm} disabled={loading}>
        {loading ? "..." : "Potvrdit platbu"}
      </Button>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}

export function PaymentsPageContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetch("/api/payments")
      .then((res) => res.json())
      .then((data) => {
        setPayments(data.payments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const tabs = [
    { value: "all", label: "Všechny" },
    { value: "PENDING", label: "Čekající" },
    { value: "PAID", label: "Zaplacené" },
    { value: "FAILED", label: "Neúspěšné" },
  ];

  const filtered =
    activeTab === "all"
      ? payments
      : payments.filter((p) => p.status === activeTab);

  const totalAmount = filtered
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platby</h1>
          <p className="text-sm text-gray-500">
            Přehled všech plateb za vozidla
          </p>
        </div>
        {totalAmount > 0 && (
          <div className="text-right">
            <div className="text-sm text-gray-500">Celkem zaplaceno</div>
            <div className="text-xl font-bold text-green-600">
              {totalAmount.toLocaleString("cs-CZ")} Kč
            </div>
          </div>
        )}
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Načítám platby...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="💳"
            title="Žádné platby"
            description="Zatím nebyly provedeny žádné platby."
          />
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </Card>
    </div>
  );
}

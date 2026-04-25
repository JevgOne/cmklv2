"use client";

import { useState, useEffect } from "react";
import { Card, Button, Tabs, StatusPill, EmptyState } from "@/components/ui";
import { DataTable } from "@/components/admin/DataTable";

// ============================================
// SELLER PAYOUTS
// ============================================

interface SellerPayout {
  id: string;
  vehicleName: string;
  sellerName: string;
  sellerBankAccount: string;
  amount: number;
  commissionAmount: number;
  status: string;
  paidAt: string | null;
  bankReference: string | null;
  buyerName: string;
  paymentMethod: string;
  createdAt: string;
}

// ============================================
// BROKER PAYOUTS
// ============================================

interface BrokerPayout {
  id: string;
  brokerName: string;
  brokerEmail: string;
  period: string;
  totalAmount: number;
  invoiceUrl: string | null;
  invoiceNumber: string | null;
  status: string;
  approvedByName: string | null;
  paidAt: string | null;
  commissions: {
    id: string;
    vehicleName: string;
    salePrice: number;
    brokerShare: number | null;
  }[];
  createdAt: string;
}

const sellerStatusConfig: Record<string, { label: string; variant: "active" | "pending" | "rejected" | "sold" | "draft" }> = {
  PENDING: { label: "Čeká", variant: "pending" },
  PROCESSING: { label: "Zpracovává se", variant: "pending" },
  PAID: { label: "Vyplaceno", variant: "active" },
  FAILED: { label: "Selhalo", variant: "rejected" },
};

const brokerStatusConfig: Record<string, { label: string; variant: "active" | "pending" | "rejected" | "sold" | "draft" }> = {
  PENDING_INVOICE: { label: "Čeká faktura", variant: "pending" },
  INVOICE_UPLOADED: { label: "Faktura nahrána", variant: "sold" },
  APPROVED: { label: "Schváleno", variant: "active" },
  PAID: { label: "Vyplaceno", variant: "active" },
};

// ============================================
// SELLER COLUMNS
// ============================================

const sellerColumns = [
  {
    key: "vehicle",
    header: "Vozidlo",
    render: (p: SellerPayout) => (
      <span className="font-medium text-gray-900">{p.vehicleName}</span>
    ),
  },
  {
    key: "seller",
    header: "Prodejce",
    render: (p: SellerPayout) => (
      <div>
        <div className="text-sm font-medium text-gray-900">{p.sellerName}</div>
        <div className="text-xs text-gray-500 font-mono">
          {p.sellerBankAccount || "Účet nezadán"}
        </div>
      </div>
    ),
  },
  {
    key: "amount",
    header: "K výplatě",
    render: (p: SellerPayout) => (
      <div>
        <div className="font-semibold text-gray-900">
          {p.amount.toLocaleString("cs-CZ")} Kč
        </div>
        <div className="text-xs text-gray-500">
          Provize: {p.commissionAmount.toLocaleString("cs-CZ")} Kč
        </div>
      </div>
    ),
  },
  {
    key: "status",
    header: "Stav",
    render: (p: SellerPayout) => {
      const config = sellerStatusConfig[p.status] || { label: p.status, variant: "draft" as const };
      return <StatusPill variant={config.variant}>{config.label}</StatusPill>;
    },
  },
  {
    key: "date",
    header: "Datum",
    className: "hidden md:table-cell",
    render: (p: SellerPayout) => (
      <span className="text-sm text-gray-500">
        {new Date(p.createdAt).toLocaleDateString("cs-CZ")}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Akce",
    render: (p: SellerPayout) => <SellerPayoutActions payout={p} />,
  },
];

function SellerPayoutActions({ payout }: { payout: SellerPayout }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (payout.status !== "PENDING") {
    return (
      <span className="text-xs text-gray-400">
        {payout.bankReference || (payout.paidAt ? "Vyplaceno" : "-")}
      </span>
    );
  }

  async function handleProcess() {
    const ref = prompt("Zadejte referenci bankovního převodu:");
    if (!ref) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/payouts/seller/${payout.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankReference: ref }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Chyba");
      }
    } catch {
      setError("Nastala chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button size="sm" variant="success" onClick={handleProcess} disabled={loading}>
        {loading ? "..." : "Vyplatit"}
      </Button>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}

// ============================================
// BROKER COLUMNS
// ============================================

const brokerColumns = [
  {
    key: "broker",
    header: "Makléř",
    render: (p: BrokerPayout) => (
      <div>
        <div className="text-sm font-medium text-gray-900">{p.brokerName}</div>
        <div className="text-xs text-gray-500">{p.brokerEmail}</div>
      </div>
    ),
  },
  {
    key: "period",
    header: "Období",
    render: (p: BrokerPayout) => (
      <span className="font-medium text-gray-900">{p.period}</span>
    ),
  },
  {
    key: "amount",
    header: "Částka",
    render: (p: BrokerPayout) => (
      <div>
        <div className="font-semibold text-gray-900">
          {p.totalAmount.toLocaleString("cs-CZ")} Kč
        </div>
        <div className="text-xs text-gray-500">
          {p.commissions.length} proviz{p.commissions.length === 1 ? "e" : "í"}
        </div>
      </div>
    ),
  },
  {
    key: "invoice",
    header: "Faktura",
    className: "hidden md:table-cell",
    render: (p: BrokerPayout) =>
      p.invoiceNumber ? (
        <div>
          <div className="text-sm text-gray-700">{p.invoiceNumber}</div>
          {p.invoiceUrl && (
            <a
              href={p.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-500 hover:underline"
            >
              Zobrazit
            </a>
          )}
        </div>
      ) : (
        <span className="text-xs text-gray-400">-</span>
      ),
  },
  {
    key: "status",
    header: "Stav",
    render: (p: BrokerPayout) => {
      const config = brokerStatusConfig[p.status] || { label: p.status, variant: "draft" as const };
      return <StatusPill variant={config.variant}>{config.label}</StatusPill>;
    },
  },
  {
    key: "actions",
    header: "Akce",
    render: (p: BrokerPayout) => <BrokerPayoutActions payout={p} />,
  },
];

function BrokerPayoutActions({ payout }: { payout: BrokerPayout }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (payout.status === "PAID") {
    return <span className="text-xs text-gray-400">Vyplaceno</span>;
  }

  if (payout.status === "APPROVED") {
    return (
      <span className="text-xs text-green-600">
        Schválil: {payout.approvedByName}
      </span>
    );
  }

  if (payout.status !== "INVOICE_UPLOADED") {
    return <span className="text-xs text-gray-400">Čeká na fakturu</span>;
  }

  async function handleApprove() {
    if (!confirm("Opravdu chcete schválit tuto fakturu?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/payouts/broker/${payout.id}/approve`, {
        method: "PUT",
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Chyba");
      }
    } catch {
      setError("Nastala chyba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button size="sm" variant="success" onClick={handleApprove} disabled={loading}>
        {loading ? "..." : "Schválit"}
      </Button>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PayoutsPageContent() {
  const [activeSection, setActiveSection] = useState("seller");
  const [sellerPayouts, setSellerPayouts] = useState<SellerPayout[]>([]);
  const [brokerPayouts, setBrokerPayouts] = useState<BrokerPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPeriod, setGeneratingPeriod] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/payouts/seller").then((r) => r.json()),
      fetch("/api/payouts/broker").then((r) => r.json()),
    ])
      .then(([sellerData, brokerData]) => {
        setSellerPayouts(sellerData.payouts || []);
        setBrokerPayouts(brokerData.payouts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleGeneratePayouts() {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const period = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

    if (
      !confirm(
        `Generovat uzávěrku provizí za období ${period}?`
      )
    )
      return;

    setGeneratingPeriod(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/payouts/broker/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({ type: "success", text: `Vytvořeno ${data.created} výplat za období ${period}` });
        window.location.reload();
      } else {
        setStatusMessage({ type: "error", text: data.error || "Chyba" });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Nastala chyba" });
    } finally {
      setGeneratingPeriod(false);
    }
  }

  const sectionTabs = [
    { value: "seller", label: "Výplaty prodejcům" },
    { value: "broker", label: "Provize makléřům" },
  ];

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${statusMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {statusMessage.text}
          <button onClick={() => setStatusMessage(null)} className="ml-3 text-current opacity-50 hover:opacity-100 border-none bg-transparent cursor-pointer">x</button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Výplaty</h1>
          <p className="text-sm text-gray-500">
            Správa výplat prodejcům a provizí makléřům
          </p>
        </div>
        {activeSection === "broker" && (
          <Button
            variant="primary"
            onClick={handleGeneratePayouts}
            disabled={generatingPeriod}
          >
            {generatingPeriod ? "Generuji..." : "Měsíční uzávěrka"}
          </Button>
        )}
      </div>

      <Tabs
        tabs={sectionTabs}
        activeTab={activeSection}
        onTabChange={setActiveSection}
      />

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Načítám výplaty...</div>
        ) : activeSection === "seller" ? (
          sellerPayouts.length === 0 ? (
            <EmptyState
              icon="💰"
              title="Žádné výplaty prodejcům"
              description="Výplaty se vytvoří automaticky po potvrzení platby."
            />
          ) : (
            <DataTable columns={sellerColumns} data={sellerPayouts} />
          )
        ) : brokerPayouts.length === 0 ? (
          <EmptyState
            icon="📄"
            title="Žádné provize k výplatě"
            description="Spusťte měsíční uzávěrku pro generování výplat."
          />
        ) : (
          <DataTable columns={brokerColumns} data={brokerPayouts} />
        )}
      </Card>
    </div>
  );
}

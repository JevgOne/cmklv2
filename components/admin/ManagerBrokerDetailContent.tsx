"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, StatusPill, Tabs } from "@/components/ui";
import { DataTable } from "@/components/admin/DataTable";

interface BrokerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string | null;
  status: string;
  bio: string;
  specializations: string[];
  cities: string[];
  ico: string;
  bankAccount: string;
  slug: string;
  createdAt: string;
  totalVehicles: number;
  totalCommissions: number;
}

interface VehicleItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  status: string;
  mileage: number;
  image: string | null;
  createdAt: string;
}

interface CommissionItem {
  id: string;
  vehicle: string;
  salePrice: number;
  commission: number;
  rate: number;
  status: string;
  soldAt: string;
}

interface ManagerBrokerDetailContentProps {
  broker: BrokerProfile;
  vehicles: VehicleItem[];
  commissions: CommissionItem[];
}

const vehicleStatusMap: Record<string, { label: string; variant: "active" | "pending" | "rejected" }> = {
  DRAFT: { label: "Koncept", variant: "pending" },
  PENDING: { label: "Čekající", variant: "pending" },
  ACTIVE: { label: "Aktivní", variant: "active" },
  RESERVED: { label: "Rezervováno", variant: "pending" },
  SOLD: { label: "Prodáno", variant: "active" },
  PAID: { label: "Zaplaceno", variant: "active" },
  REJECTED: { label: "Zamítnuto", variant: "rejected" },
  ARCHIVED: { label: "Archivováno", variant: "rejected" },
};

const commissionStatusMap: Record<string, { label: string; variant: "active" | "pending" | "rejected" }> = {
  PENDING: { label: "Čekající", variant: "pending" },
  APPROVED: { label: "Schváleno", variant: "active" },
  PAID: { label: "Vyplaceno", variant: "active" },
  CANCELLED: { label: "Zrušeno", variant: "rejected" },
};

export function ManagerBrokerDetailContent({
  broker,
  vehicles,
  commissions,
}: ManagerBrokerDetailContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [deactivating, setDeactivating] = useState(false);

  const tabs = [
    { value: "profile", label: "Profil" },
    { value: "vehicles", label: `Vozidla (${vehicles.length})` },
    { value: "commissions", label: `Provize (${commissions.length})` },
    { value: "stats", label: "Statistiky" },
  ];

  const statusInfo: Record<string, { label: string; variant: "verified" | "pending" | "rejected" }> = {
    ACTIVE: { label: "Aktivní", variant: "verified" },
    PENDING: { label: "Čekající", variant: "pending" },
    ONBOARDING: { label: "Onboarding", variant: "pending" },
    SUSPENDED: { label: "Pozastaven", variant: "rejected" },
    INACTIVE: { label: "Neaktivní", variant: "rejected" },
  };

  const brokerStatus = statusInfo[broker.status] || {
    label: broker.status,
    variant: "pending" as const,
  };

  const [actionError, setActionError] = useState("");

  const handleDeactivate = async () => {
    if (
      !confirm(
        `Opravdu chcete deaktivovat makléře ${broker.firstName} ${broker.lastName}? Jeho aktivní vozidla budou archivována.`
      )
    ) {
      return;
    }

    setDeactivating(true);
    setActionError("");
    try {
      const res = await fetch(
        `/api/manager/brokers/${broker.id}/deactivate`,
        { method: "POST" }
      );
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Deaktivace se nezdařila.");
      }
    } catch {
      setActionError("Došlo k chybě.");
    } finally {
      setDeactivating(false);
    }
  };

  const totalCommissionAmount = commissions.reduce(
    (sum, c) => sum + c.commission,
    0
  );
  const paidCommissions = commissions.filter((c) => c.status === "PAID");
  const paidTotal = paidCommissions.reduce((sum, c) => sum + c.commission, 0);

  const vehicleColumns = [
    {
      key: "vehicle",
      header: "Vozidlo",
      render: (item: VehicleItem) => (
        <div className="flex items-center gap-3">
          <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
            {item.image ? (
              <img
                src={item.image}
                alt={`${item.brand} ${item.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl text-gray-300">🚗</span>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {item.brand} {item.model}
            </div>
            <div className="text-xs text-gray-500">
              {item.year} · {item.mileage.toLocaleString("cs-CZ")} km
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Cena",
      render: (item: VehicleItem) => (
        <span className="font-semibold text-gray-900">
          {item.price.toLocaleString("cs-CZ")} Kč
        </span>
      ),
    },
    {
      key: "status",
      header: "Stav",
      render: (item: VehicleItem) => {
        const s = vehicleStatusMap[item.status] || {
          label: item.status,
          variant: "pending" as const,
        };
        return <StatusPill variant={s.variant}>{s.label}</StatusPill>;
      },
    },
  ];

  const commissionColumns = [
    {
      key: "vehicle",
      header: "Vozidlo",
      render: (item: CommissionItem) => (
        <span className="font-semibold text-gray-900">{item.vehicle}</span>
      ),
    },
    {
      key: "salePrice",
      header: "Prodejní cena",
      render: (item: CommissionItem) => (
        <span className="text-sm text-gray-700">
          {item.salePrice.toLocaleString("cs-CZ")} Kč
        </span>
      ),
    },
    {
      key: "commission",
      header: "Provize",
      render: (item: CommissionItem) => (
        <span className="font-semibold text-gray-900">
          {item.commission.toLocaleString("cs-CZ")} Kč ({(item.rate * 100).toFixed(0)}%)
        </span>
      ),
    },
    {
      key: "status",
      header: "Stav",
      render: (item: CommissionItem) => {
        const s = commissionStatusMap[item.status] || {
          label: item.status,
          variant: "pending" as const,
        };
        return <StatusPill variant={s.variant}>{s.label}</StatusPill>;
      },
    },
    {
      key: "soldAt",
      header: "Datum prodeje",
      render: (item: CommissionItem) => (
        <span className="text-sm text-gray-500">
          {new Date(item.soldAt).toLocaleDateString("cs-CZ")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <img
            src={broker.avatar || "/brand/default-avatar.png"}
            alt={`${broker.firstName} ${broker.lastName}`}
            className="w-20 h-20 rounded-2xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-extrabold text-gray-900">
                {broker.firstName} {broker.lastName}
              </h1>
              <Badge variant={brokerStatus.variant}>{brokerStatus.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
              <span>{broker.email}</span>
              {broker.phone && <span>{broker.phone}</span>}
              {broker.ico && <span>IČ: {broker.ico}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {broker.cities.map((city: string) => (
                <span
                  key={city}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                >
                  {city}
                </span>
              ))}
              {broker.specializations.map((spec: string) => (
                <span
                  key={spec}
                  className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-md"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/admin/manager/brokers/${broker.id}/transfer`)
              }
            >
              Přenést vozy
            </Button>
            {broker.status === "ACTIVE" && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeactivate}
                disabled={deactivating}
              >
                {deactivating ? "Deaktivuji..." : "Deaktivovat"}
              </Button>
            )}
          </div>
          {actionError && (
            <div className="mt-2 text-sm text-red-500 font-medium">{actionError}</div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Kontaktní údaje</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {broker.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Telefon</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {broker.phone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">IČO</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {broker.ico || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Bankovní účet</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {broker.bankAccount || "—"}
                </dd>
              </div>
            </dl>
          </Card>
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">O makléřovi</h3>
            <p className="text-sm text-gray-700 mb-4">
              {broker.bio || "Žádné bio."}
            </p>
            <div className="text-xs text-gray-500">
              Registrován:{" "}
              {new Date(broker.createdAt).toLocaleDateString("cs-CZ")}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "vehicles" && (
        <Card className="!p-0 overflow-hidden">
          {vehicles.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              Makléř nemá žádná vozidla.
            </div>
          ) : (
            <DataTable columns={vehicleColumns} data={vehicles} />
          )}
        </Card>
      )}

      {activeTab === "commissions" && (
        <Card className="!p-0 overflow-hidden">
          {commissions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              Zatím žádné provize.
            </div>
          ) : (
            <DataTable columns={commissionColumns} data={commissions} />
          )}
        </Card>
      )}

      {activeTab === "stats" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 text-center">
            <div className="text-3xl font-extrabold text-gray-900 mb-1">
              {broker.totalVehicles}
            </div>
            <div className="text-sm text-gray-500">Celkem vozidel</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-extrabold text-gray-900 mb-1">
              {broker.totalCommissions}
            </div>
            <div className="text-sm text-gray-500">Celkem prodejů</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-extrabold text-gray-900 mb-1">
              {totalCommissionAmount.toLocaleString("cs-CZ")} Kč
            </div>
            <div className="text-sm text-gray-500">Celkem provize</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-extrabold text-gray-900 mb-1">
              {paidTotal.toLocaleString("cs-CZ")} Kč
            </div>
            <div className="text-sm text-gray-500">Vyplaceno</div>
          </Card>
        </div>
      )}
    </div>
  );
}

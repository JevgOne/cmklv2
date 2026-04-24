"use client";

import { useState, useEffect } from "react";
import { Button, Tabs, Pagination, StatusPill, TrustScore, Card } from "@/components/ui";
import { DataTable } from "@/components/admin/DataTable";

interface Vehicle {
  id: string;
  name: string;
  vin: string;
  brokerName: string;
  brokerInitials: string;
  price: string;
  status: "active" | "pending" | "rejected" | "sold" | "draft";
  trustScore: number;
  date: string;
  imageUrl: string | null;
}

const statusLabels: Record<Vehicle["status"], string> = {
  active: "Aktivní",
  pending: "Čekající",
  rejected: "Zamítnuté",
  sold: "Prodáno",
  draft: "Koncept",
};

function TableActions({ vehicleId }: { vehicleId: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`/admin/vehicles/${vehicleId}`}
        className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-[10px] text-sm cursor-pointer transition-colors hover:bg-gray-200 border-none no-underline"
        title="Zobrazit"
      >
        👁
      </a>
      <a
        href={`/admin/vehicles/${vehicleId}/edit`}
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
    key: "vehicle",
    header: "Vozidlo",
    render: (item: Vehicle) => (
      <div className="flex items-center gap-3">
        <div className="w-[60px] h-[45px] bg-gray-100 rounded-md flex items-center justify-center text-lg shrink-0 overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            "🚗"
          )}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{item.name}</div>
          <div className="text-xs text-gray-500 font-mono">{item.vin}</div>
        </div>
      </div>
    ),
  },
  {
    key: "broker",
    header: "Makléř",
    render: (item: Vehicle) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          {item.brokerInitials}
        </div>
        <span className="text-sm">{item.brokerName}</span>
      </div>
    ),
  },
  {
    key: "price",
    header: "Cena",
    render: (item: Vehicle) => (
      <span className="font-bold">{item.price}</span>
    ),
  },
  {
    key: "status",
    header: "Stav",
    render: (item: Vehicle) => {
      const variant = item.status === "draft" ? "draft" : item.status;
      return (
        <StatusPill variant={variant}>
          {statusLabels[item.status] || item.status}
        </StatusPill>
      );
    },
  },
  {
    key: "trustScore",
    header: "Skóre důvěry",
    render: (item: Vehicle) => (
      <TrustScore value={item.trustScore} className="!shadow-none !p-0 !bg-transparent" />
    ),
  },
  {
    key: "date",
    header: "Datum",
    render: (item: Vehicle) => (
      <span className="text-sm text-gray-500">{item.date}</span>
    ),
  },
  {
    key: "actions",
    header: "Akce",
    render: (item: Vehicle) => <TableActions vehicleId={item.id} />,
  },
];

export function VehiclesPageContent() {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicles() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/vehicles");
        if (res.ok) {
          const data = await res.json();
          setVehicles(data.vehicles);
        }
      } catch (err) {
        console.error("Chyba při načítání vozidel:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVehicles();
  }, []);

  const filteredVehicles =
    activeTab === "all"
      ? vehicles
      : vehicles.filter((v) => v.status === activeTab);

  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / perPage));
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const activeCnt = vehicles.filter((v) => v.status === "active").length;
  const pendingCnt = vehicles.filter((v) => v.status === "pending").length;
  const rejectedCnt = vehicles.filter((v) => v.status === "rejected").length;
  const soldCnt = vehicles.filter((v) => v.status === "sold").length;

  const tabs = [
    { value: "all", label: `Všechna (${vehicles.length})` },
    { value: "active", label: `Aktivní (${activeCnt})` },
    { value: "pending", label: `Čekající (${pendingCnt})` },
    { value: "rejected", label: `Zamítnutá (${rejectedCnt})` },
    { value: "sold", label: `Prodaná (${soldCnt})` },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-sm text-gray-500 mb-1">Admin / Vozidla</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Vozidla</h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" disabled>
              Filtrovat
            </Button>
            <Button variant="primary" size="sm" disabled title="Vozidla přidávají makléři přes PWA aplikaci">
              Přidat vozidlo
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
            Načítám vozidla...
          </div>
        ) : paginatedVehicles.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Žádná vozidla k zobrazení.
          </div>
        ) : (
          <DataTable columns={columns} data={paginatedVehicles} />
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

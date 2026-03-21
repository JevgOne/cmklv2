"use client";

import { useState } from "react";
import { MonthStats } from "./MonthStats";
import { SaleCard } from "./SaleCard";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";

interface CommissionData {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    variant: string | null;
    price: number;
  } | null;
}

interface CommissionsViewProps {
  initialCommissions: CommissionData[];
  initialStats: { total: number; paid: number; pending: number };
  initialMonth: string;
}

function generateMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  const months = [
    "Leden", "Unor", "Brezen", "Duben", "Kveten", "Cerven",
    "Cervenec", "Srpen", "Zari", "Rijen", "Listopad", "Prosinec",
  ];

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = `${months[date.getMonth()]} ${date.getFullYear()}`;
    options.push({ value, label });
  }

  return options;
}

export function CommissionsView({
  initialCommissions,
  initialStats,
  initialMonth,
}: CommissionsViewProps) {
  const [month, setMonth] = useState(initialMonth);
  const [commissions, setCommissions] = useState(initialCommissions);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);

  const monthOptions = generateMonthOptions();

  const handleMonthChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    setMonth(newMonth);
    setLoading(true);

    try {
      const res = await fetch(`/api/broker/commissions?month=${newMonth}`);
      if (res.ok) {
        const data = await res.json();
        setCommissions(data.commissions);
        setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select
        value={month}
        onChange={handleMonthChange}
        options={monthOptions}
      />

      <MonthStats
        total={stats.total}
        paid={stats.paid}
        pending={stats.pending}
        salesCount={commissions.length}
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : commissions.length === 0 ? (
        <EmptyState
          icon="💰"
          title="Zadne provize"
          description="V tomto mesici jeste nemáte zadne provize."
        />
      ) : (
        <div className="space-y-3">
          {commissions.map((c) => {
            const vehicleName = c.vehicle
              ? `${c.vehicle.brand} ${c.vehicle.model}${c.vehicle.variant ? ` ${c.vehicle.variant}` : ""}`
              : "Neznamy vuz";

            return (
              <SaleCard
                key={c.id}
                vehicleName={vehicleName}
                salePrice={c.vehicle?.price ?? 0}
                commission={c.amount}
                status={c.status}
                date={c.createdAt}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";

interface StatsData {
  type: string;
  funnel?: { views: number; leads: number; sold: number };
  conversionRate?: string;
  totalVehicles?: number;
  activeVehicles?: number;
  totalParts?: number;
  activeParts?: number;
  totalOrders?: number;
}

export default function PartnerStatsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/partner/stats");
        if (res.ok) setStats(await res.json());
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm h-32" />
          ))}
        </div>
      </div>
    );
  }

  const isBazar = session?.user?.role === "PARTNER_BAZAR";

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Statistiky</h1>

      {isBazar && stats?.funnel ? (
        <>
          {/* Funnel visualization */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Konverzni funnel
            </h3>
            <div className="flex items-end justify-center gap-8 h-40">
              {[
                { label: "Zobrazeni", value: stats.funnel.views, color: "bg-blue-400" },
                { label: "Zajemci", value: stats.funnel.leads, color: "bg-orange-400" },
                { label: "Prodeje", value: stats.funnel.sold, color: "bg-green-500" },
              ].map((step) => {
                const maxVal = Math.max(stats.funnel!.views, 1);
                const height = Math.max((step.value / maxVal) * 120, 8);
                return (
                  <div key={step.label} className="flex flex-col items-center gap-2">
                    <span className="text-2xl font-extrabold text-gray-900">
                      {step.value.toLocaleString("cs-CZ")}
                    </span>
                    <div
                      className={`w-20 rounded-t-lg ${step.color}`}
                      style={{ height: `${height}px` }}
                    />
                    <span className="text-xs text-gray-500">{step.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-4">
              <span className="text-sm text-gray-500">Konverzni rate: </span>
              <span className="text-lg font-bold text-orange-500">
                {stats.conversionRate}%
              </span>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon="🚗"
              iconColor="blue"
              value={String(stats.totalVehicles || 0)}
              label="Celkem vozidel"
            />
            <StatCard
              icon="✅"
              iconColor="green"
              value={String(stats.activeVehicles || 0)}
              label="Aktivnich"
            />
          </div>
        </>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon="🔧"
            iconColor="blue"
            value={String(stats.totalParts || 0)}
            label="Celkem dilu"
          />
          <StatCard
            icon="✅"
            iconColor="green"
            value={String(stats.activeParts || 0)}
            label="Aktivnich"
          />
          <StatCard
            icon="📦"
            iconColor="orange"
            value={String(stats.totalOrders || 0)}
            label="Objednavek"
          />
        </div>
      ) : null}
    </div>
  );
}

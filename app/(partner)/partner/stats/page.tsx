"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { RevenueChart } from "@/components/ui/charts/RevenueChart";
import { OrdersChart } from "@/components/ui/charts/OrdersChart";

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
  const [error, setError] = useState<string | null>(null);

  interface ChartMonth {
    label: string;
    month: string;
    count: number;
    revenue: number;
    leads?: number;
  }
  const [chartData, setChartData] = useState<ChartMonth[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/partner/stats");
      if (res.ok) setStats(await res.json());
      else setError("Nepodařilo se na��íst statistiky");
    } catch {
      setError("Chyba připojení k serveru");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    async function loadCharts() {
      try {
        const res = await fetch("/api/partner/stats/charts?months=6");
        if (res.ok) {
          const data = await res.json();
          setChartData(data.months || []);
        }
      } catch { /* silent */ }
      finally { setChartLoading(false); }
    }
    loadCharts();
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="text-gray-900 font-semibold mb-2">{error}</p>
        <Button variant="outline" onClick={loadStats}>Zkusit znovu</Button>
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

      {/* Charts */}
      {!chartLoading && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
              Trzby po mesicich
            </h3>
            <RevenueChart data={chartData} height={180} />
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
              {isBazar ? "Prodeje po mesicich" : "Objednavky po mesicich"}
            </h3>
            <OrdersChart
              data={chartData}
              height={180}
              barLabel={isBazar ? "Prodeje" : "Objednavky"}
            />
          </Card>
        </div>
      )}

      {chartLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm h-52 animate-pulse" />
          <div className="bg-white rounded-2xl p-4 shadow-sm h-52 animate-pulse" />
        </div>
      )}
    </div>
  );
}

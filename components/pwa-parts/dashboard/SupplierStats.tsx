"use client";

import { useState, useEffect } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { RevenueChart } from "@/components/ui/charts/RevenueChart";
import { Card } from "@/components/ui/Card";

interface StatsData {
  activeParts: number;
  pendingOrders: number;
  revenue: number;
  rating: number;
}

export function SupplierStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<Array<{ label: string; revenue: number }>>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/parts/supplier-stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Fallback to defaults
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchCharts() {
      try {
        const res = await fetch("/api/partner/stats/charts?months=6");
        if (res.ok) {
          const data = await res.json();
          setChartData(data.months || []);
        }
      } catch { /* silent */ }
    }
    fetchCharts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        icon={<span>📦</span>}
        iconColor="green"
        value={String(stats?.activeParts ?? 0)}
        label="Aktivní díly"
      />
      <StatCard
        icon={<span>🛒</span>}
        iconColor="orange"
        value={String(stats?.pendingOrders ?? 0)}
        label="K vyřízení"
      />
      <StatCard
        icon={<span>💰</span>}
        iconColor="blue"
        value={`${(stats?.revenue ?? 0).toLocaleString("cs-CZ")} Kč`}
        label="Tržby (měsíc)"
      />
      <StatCard
        icon={<span>⭐</span>}
        iconColor="orange"
        value={stats?.rating ? stats.rating.toFixed(1) : "—"}
        label="Hodnocení"
      />
      {chartData.length > 0 && (
        <Card className="p-3 col-span-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Trzby (6 mesicu)</h4>
          <RevenueChart data={chartData} height={120} />
        </Card>
      )}
    </div>
  );
}

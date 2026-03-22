"use client";

import { useState, useEffect } from "react";
import { StatCard } from "@/components/ui/StatCard";

interface StatsData {
  activeParts: number;
  pendingOrders: number;
  revenue: number;
  rating: number;
}

export function SupplierStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

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
        label="Aktivni dily"
      />
      <StatCard
        icon={<span>🛒</span>}
        iconColor="orange"
        value={String(stats?.pendingOrders ?? 0)}
        label="K vyrizeni"
      />
      <StatCard
        icon={<span>💰</span>}
        iconColor="blue"
        value={`${(stats?.revenue ?? 0).toLocaleString("cs-CZ")} Kc`}
        label="Trzby (mesic)"
      />
      <StatCard
        icon={<span>⭐</span>}
        iconColor="orange"
        value={stats?.rating ? stats.rating.toFixed(1) : "—"}
        label="Hodnoceni"
      />
    </div>
  );
}

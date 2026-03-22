"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface DashboardStats {
  favorites: number;
  watchdogs: number;
  inquiries: number;
}

export default function MujUcetPage() {
  const [stats, setStats] = useState<DashboardStats>({ favorites: 0, watchdogs: 0, inquiries: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/buyer/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<span>&#9829;</span>}
          iconColor="red"
          value={String(stats.favorites)}
          label="Oblíbené vozy"
        />
        <StatCard
          icon={<span>&#128276;</span>}
          iconColor="blue"
          value={String(stats.watchdogs)}
          label="Hlídací psi"
        />
        <StatCard
          icon={<span>&#128172;</span>}
          iconColor="green"
          value={String(stats.inquiries)}
          label="Odeslaných dotazů"
        />
      </div>

      {/* Quick actions */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Rychlé akce</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/muj-ucet/oblibene" className="no-underline">
            <Card hover className="p-5 text-center">
              <div className="text-2xl mb-2">&#9829;</div>
              <h4 className="font-semibold text-gray-900 text-sm">Oblíbené vozy</h4>
              <p className="text-xs text-gray-500 mt-1">Prohlédněte si uložené inzeráty</p>
            </Card>
          </Link>
          <Link href="/muj-ucet/hlidaci-pes" className="no-underline">
            <Card hover className="p-5 text-center">
              <div className="text-2xl mb-2">&#128276;</div>
              <h4 className="font-semibold text-gray-900 text-sm">Hlídací pes</h4>
              <p className="text-xs text-gray-500 mt-1">Nastavte upozornění na nové vozy</p>
            </Card>
          </Link>
          <Link href="/nabidka" className="no-underline">
            <Card hover className="p-5 text-center">
              <div className="text-2xl mb-2">&#128269;</div>
              <h4 className="font-semibold text-gray-900 text-sm">Hledat vozy</h4>
              <p className="text-xs text-gray-500 mt-1">Prohlédněte si aktuální nabídku</p>
            </Card>
          </Link>
        </div>
      </Card>
    </div>
  );
}

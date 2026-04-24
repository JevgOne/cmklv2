"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface DashboardData {
  type: string;
  stats: Record<string, number>;
  recentLeads?: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
}

export default function PartnerDashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/partner/dashboard");
      if (res.ok) setData(await res.json());
      else setError("Nepodařilo se načíst dashboard");
    } catch {
      setError("Chyba připojení k serveru");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <Button variant="outline" onClick={loadData}>Zkusit znovu</Button>
      </div>
    );
  }

  const isBazar = session?.user?.role === "PARTNER_BAZAR";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        {isBazar ? (
          <Link href="/partner/vehicles/new">
            <Button variant="primary" size="sm">
              Pridat vozidlo
            </Button>
          </Link>
        ) : (
          <Link href="/partner/parts/new">
            <Button variant="primary" size="sm">
              Pridat dil
            </Button>
          </Link>
        )}
      </div>

      {/* Stat cards */}
      {isBazar && data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon="🚗"
            iconColor="blue"
            value={String(data.stats.totalVehicles || 0)}
            label="Vozidla v systemu"
          />
          <StatCard
            icon="👥"
            iconColor="orange"
            value={String(data.stats.leadsThisMonth || 0)}
            label="Zajemci tento mesic"
          />
          <StatCard
            icon="✅"
            iconColor="green"
            value={String(data.stats.soldVehicles || 0)}
            label="Prodano pres Carmakler"
          />
          <StatCard
            icon="📊"
            iconColor="blue"
            value={String(data.stats.activeVehicles || 0)}
            label="Aktivni vozidla"
          />
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon="🔧"
            iconColor="blue"
            value={String(data.stats.totalParts || 0)}
            label="Dilu v systemu"
          />
          <StatCard
            icon="📦"
            iconColor="orange"
            value={String(data.stats.ordersThisMonth || 0)}
            label="Objednavky tento mesic"
          />
          <StatCard
            icon="✅"
            iconColor="green"
            value={String(data.stats.activeParts || 0)}
            label="Aktivnich dilu"
          />
        </div>
      ) : null}

      {/* Recent leads (bazar) */}
      {isBazar && data?.recentLeads && data.recentLeads.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Posledni zajemci
          </h3>
          <div className="space-y-3">
            {data.recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <div className="font-semibold text-sm text-gray-900">
                    {lead.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(lead.createdAt).toLocaleDateString("cs-CZ")}
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-500">
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/partner/leads"
            className="text-sm text-orange-500 font-semibold mt-4 block"
          >
            Zobrazit vse →
          </Link>
        </Card>
      )}
    </div>
  );
}

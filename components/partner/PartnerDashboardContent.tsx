"use client";

import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface RecentLead {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface DashboardData {
  type: string;
  stats: Record<string, number>;
  recentLeads?: RecentLead[];
}

export function PartnerDashboardContent({ data, isBazar }: { data: DashboardData; isBazar: boolean }) {
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

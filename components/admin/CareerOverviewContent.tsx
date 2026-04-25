"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { LevelBadge } from "@/components/pwa/gamification/LevelBadge";
import { STAR_LEVELS, REGION_THRESHOLDS } from "@/lib/gamification-levels";
import { formatPrice } from "@/lib/utils";

interface BrokerCareerData {
  id: string;
  firstName: string;
  lastName: string;
  level: string;
  totalRevenue: number;
  totalSales: number;
  regionName: string;
  regionTier: string;
  commissionRate: number;
  monthlyRevenue: number;
  pendingPayout: number;
}

export function CareerOverviewContent() {
  const [brokers, setBrokers] = useState<BrokerCareerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  useEffect(() => {
    fetch("/api/admin/career")
      .then((res) => res.json())
      .then((data) => {
        setBrokers(data.brokers ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const regions = [...new Set(brokers.map((b) => b.regionName))].sort();
  const filtered = brokers.filter((b) => {
    if (filterRegion !== "all" && b.regionName !== filterRegion) return false;
    if (filterLevel !== "all" && b.level !== filterLevel) return false;
    return true;
  });

  const handleExportCSV = () => {
    const header = "Jméno,Region,Tier,Obrat,Úroveň,Provize %,Prodeje,Obrat měsíc,K vyplacení\n";
    const rows = filtered.map((b) =>
      `"${b.firstName} ${b.lastName}","${b.regionName}","${b.regionTier}",${b.totalRevenue},"${b.level}",${Math.round(b.commissionRate * 100)},${b.totalSales},${b.monthlyRevenue},${b.pendingPayout}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "career-overview.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Kariérní systém</h1>
          <p className="text-sm text-gray-500 mt-1">Přehled makléřů, hvězdičky a provize</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Export CSV
        </button>
      </div>

      {/* Vysvětlivky systému */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Prahy dle regionu</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-500">Úroveň</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-500">Provize</th>
                {(Object.keys(REGION_THRESHOLDS) as string[]).map((tier) => (
                  <th key={tier} className="text-right py-2 px-3 font-semibold text-gray-500">
                    {tier}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAR_LEVELS.map((sl) => (
                <tr key={sl.key} className="border-b border-gray-100">
                  <td className="py-2 px-3">
                    <span className="text-sm">{"⭐".repeat(sl.stars)} Makléř</span>
                  </td>
                  <td className="py-2 px-3 font-bold text-orange-600">
                    {Math.round(sl.commissionRate * 100)}%
                  </td>
                  {(Object.keys(REGION_THRESHOLDS) as string[]).map((tier) => (
                    <td key={tier} className="text-right py-2 px-3 text-gray-700">
                      {formatPrice(REGION_THRESHOLDS[tier][sl.key as keyof typeof REGION_THRESHOLDS.PRAHA])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>• Úroveň se určuje dle celkového kumulativního obratu prodejů v regionu</p>
          <p>• Jednou dosažená úroveň se neztrácí (kumulativní obrat neklesá)</p>
          <p>• Snížení úrovně může provést pouze ADMIN nebo MANAGER</p>
          <p>• Manažerský bonus: 2 500 Kč fixně za každý prodej</p>
        </div>
      </Card>

      {/* Filtry */}
      <div className="flex gap-3">
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="all">Všechny regiony</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="all">Všechny úrovně</option>
          {STAR_LEVELS.map((sl) => (
            <option key={sl.key} value={sl.key}>
              {"⭐".repeat(sl.stars)} ({Math.round(sl.commissionRate * 100)}%)
            </option>
          ))}
        </select>
      </div>

      {/* Tabulka makléřů */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Načítám...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Žádní makléři</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">Jméno</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">Region</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-500">Celkový obrat</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-500">Úroveň</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-500">Provize</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-500">Prodeje</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-500">Obrat měsíc</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-500">K vyplacení</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {b.firstName} {b.lastName}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{b.regionName}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {formatPrice(b.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <LevelBadge level={b.level} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-orange-600">
                      {Math.round(b.commissionRate * 100)}%
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{b.totalSales}</td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {formatPrice(b.monthlyRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">
                      {formatPrice(b.pendingPayout)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

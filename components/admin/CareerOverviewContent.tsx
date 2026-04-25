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
  const [downgradeTarget, setDowngradeTarget] = useState<BrokerCareerData | null>(null);
  const [downgradeLevel, setDowngradeLevel] = useState<string>("");
  const [downgradeReason, setDowngradeReason] = useState<string>("");
  const [downgradeSubmitting, setDowngradeSubmitting] = useState(false);
  const [downgradeError, setDowngradeError] = useState<string>("");

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

  const openDowngradeModal = (broker: BrokerCareerData) => {
    setDowngradeTarget(broker);
    setDowngradeLevel("");
    setDowngradeReason("");
    setDowngradeError("");
  };

  const handleDowngrade = async () => {
    if (!downgradeTarget || !downgradeLevel || !downgradeReason.trim()) return;
    setDowngradeSubmitting(true);
    setDowngradeError("");
    try {
      const res = await fetch(`/api/admin/career/${downgradeTarget.id}/level`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: downgradeLevel, reason: downgradeReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDowngradeError(data.error || "Chyba při snižování úrovně");
        setDowngradeSubmitting(false);
        return;
      }
      setBrokers((prev) =>
        prev.map((b) =>
          b.id === downgradeTarget.id
            ? { ...b, level: data.newLevel, commissionRate: STAR_LEVELS.find((l) => l.key === data.newLevel)?.commissionRate ?? b.commissionRate }
            : b
        )
      );
      setDowngradeTarget(null);
    } catch {
      setDowngradeError("Síťová chyba");
    } finally {
      setDowngradeSubmitting(false);
    }
  };

  const getLowerLevels = (currentLevel: string) => {
    const currentIdx = STAR_LEVELS.findIndex((l) => l.key === currentLevel);
    return STAR_LEVELS.filter((_, idx) => idx < currentIdx);
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
                  <th className="text-center py-3 px-4 font-semibold text-gray-500">Akce</th>
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
                    <td className="py-3 px-4 text-center">
                      {b.level !== "STAR_1" && (
                        <button
                          type="button"
                          onClick={() => openDowngradeModal(b)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Snížit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Downgrade modal */}
      {downgradeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Snížení úrovně
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {downgradeTarget.firstName} {downgradeTarget.lastName} — aktuálně{" "}
              {"⭐".repeat(parseInt(downgradeTarget.level.replace("STAR_", "")))}
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nová úroveň
            </label>
            <select
              value={downgradeLevel}
              onChange={(e) => setDowngradeLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white mb-4"
            >
              <option value="">Vyberte úroveň...</option>
              {getLowerLevels(downgradeTarget.level).map((sl) => (
                <option key={sl.key} value={sl.key}>
                  {"⭐".repeat(sl.stars)} — {Math.round(sl.commissionRate * 100)}%
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Důvod snížení
            </label>
            <textarea
              value={downgradeReason}
              onChange={(e) => setDowngradeReason(e.target.value)}
              placeholder="Uveďte důvod..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none mb-4"
            />

            {downgradeError && (
              <p className="text-sm text-red-600 mb-4">{downgradeError}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDowngradeTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleDowngrade}
                disabled={!downgradeLevel || !downgradeReason.trim() || downgradeSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {downgradeSubmitting ? "Ukládám..." : "Snížit úroveň"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

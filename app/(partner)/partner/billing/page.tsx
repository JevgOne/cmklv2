"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatPrice } from "@/lib/utils";

interface BillingData {
  totalRevenue: number;
  carmaklerCommission: number;
  partnerPayout: number;
  commissionRate: number;
  items: Array<{
    id: string;
    price: number;
    quantity: number;
    part: { name: string } | null;
    order: { id: string; status: string; createdAt: string } | null;
  }>;
}

export default function PartnerBillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/partner/billing");
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error("Failed to load billing:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
        Vyuctovani
      </h1>

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon="💰"
              iconColor="blue"
              value={formatPrice(data.totalRevenue)}
              label="Celkovy obrat"
            />
            <StatCard
              icon="📊"
              iconColor="orange"
              value={formatPrice(data.carmaklerCommission)}
              label={`Provize Carmakler (${data.commissionRate}%)`}
            />
            <StatCard
              icon="✅"
              iconColor="green"
              value={formatPrice(data.partnerPayout)}
              label="Vase vyplata (85%)"
            />
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Prodane dily
            </h3>
            {data.items.length === 0 ? (
              <p className="text-sm text-gray-400">
                Zatim zadne prodane dily.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">
                        Dil
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">
                        Mnozstvi
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">
                        Cena
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-600">
                        Datum
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50"
                      >
                        <td className="py-2 px-3">
                          {item.part?.name || "—"}
                        </td>
                        <td className="py-2 px-3">{item.quantity}x</td>
                        <td className="py-2 px-3 font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                        <td className="py-2 px-3 text-gray-400">
                          {item.order?.createdAt
                            ? new Date(
                                item.order.createdAt
                              ).toLocaleDateString("cs-CZ")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

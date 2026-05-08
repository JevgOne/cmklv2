"use client";

import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatPrice } from "@/lib/utils";

interface BillingItem {
  id: string;
  price: number;
  quantity: number;
  partName: string | null;
  orderDate: string | null;
}

interface BillingData {
  totalRevenue: number;
  carmaklerCommission: number;
  partnerPayout: number;
  commissionRate: number;
  items: BillingItem[];
}

export function PartnerBillingContent({ data }: { data: BillingData }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
        Vyuctovani
      </h1>

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
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Dil</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Mnozstvi</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Cena</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-600">Datum</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="py-2 px-3">{item.partName || "—"}</td>
                    <td className="py-2 px-3">{item.quantity}x</td>
                    <td className="py-2 px-3 font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </td>
                    <td className="py-2 px-3 text-gray-400">
                      {item.orderDate
                        ? new Date(item.orderDate).toLocaleDateString("cs-CZ")
                        : "—"}
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

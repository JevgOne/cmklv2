"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

interface SimilarLead {
  id: string;
  listingTitle: string | null;
  vehicleYear: number | null;
  vehiclePrice: number | null;
  vehicleMileage: number | null;
  city: string | null;
  source: string;
  sourceUrl: string | null;
}

const sourceLabels: Record<string, string> = {
  BAZOS: "Bazoš",
  SBAZAR: "Sbazar",
  SAUTO: "Sauto",
  TIPCARS: "TipCars",
  AUTOSCOUT24: "AutoScout",
  MOBILE_DE: "Mobile.de",
  MANUAL: "Manuální",
};

interface LeadSimilarTableProps {
  leads: SimilarLead[];
}

export function LeadSimilarTable({ leads }: LeadSimilarTableProps) {
  const router = useRouter();

  if (leads.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
        Podobné leady
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs">Titulek</th>
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs">Rok</th>
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs">Cena</th>
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs hidden sm:table-cell">Km</th>
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs hidden md:table-cell">Město</th>
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs hidden md:table-cell">Zdroj</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/admin/scout-leads/${lead.id}`)}
              >
                <td className="py-2 px-3 max-w-[200px] truncate">
                  {lead.listingTitle || "—"}
                </td>
                <td className="py-2 px-3 tabular-nums">{lead.vehicleYear || "—"}</td>
                <td className="py-2 px-3 font-medium tabular-nums">
                  {lead.vehiclePrice
                    ? `${lead.vehiclePrice.toLocaleString("cs-CZ")} Kč`
                    : "—"}
                </td>
                <td className="py-2 px-3 tabular-nums hidden sm:table-cell">
                  {lead.vehicleMileage
                    ? `${lead.vehicleMileage.toLocaleString("cs-CZ")} km`
                    : "—"}
                </td>
                <td className="py-2 px-3 hidden md:table-cell">{lead.city || "—"}</td>
                <td className="py-2 px-3 hidden md:table-cell">
                  {sourceLabels[lead.source] || lead.source}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

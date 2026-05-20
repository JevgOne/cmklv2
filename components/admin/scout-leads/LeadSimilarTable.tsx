"use client";

import { Card } from "@/components/ui/Card";

interface SimilarOffer {
  price: number;
  year: number | null;
  mileage: number | null;
  source: string;
  url: string | null;
  title: string | null;
}

// Legacy format from DB-based similar leads
interface LegacySimilarLead {
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
  AUTOSCOUT24: "AutoScout24",
  SAUTO: "Sauto",
  MOBILE_DE: "Mobile.de",
  BAZOS: "Bazos",
  SBAZAR: "Sbazar",
  TIPCARS: "TipCars",
  MANUAL: "Manuální",
};

const sourceColors: Record<string, string> = {
  AUTOSCOUT24: "bg-blue-50 text-blue-700",
  SAUTO: "bg-green-50 text-green-700",
  MOBILE_DE: "bg-purple-50 text-purple-700",
};

interface LeadSimilarTableProps {
  offers?: SimilarOffer[];
  leads?: LegacySimilarLead[];
}

export function LeadSimilarTable({ offers, leads }: LeadSimilarTableProps) {
  // Normalize: convert legacy leads to offer format
  const items: SimilarOffer[] =
    offers ||
    (leads || []).map((l) => ({
      price: l.vehiclePrice || 0,
      year: l.vehicleYear,
      mileage: l.vehicleMileage,
      source: l.source,
      url: l.sourceUrl,
      title: l.listingTitle,
    }));

  if (items.length === 0) return null;

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
        Podobné nabídky na trhu
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs">Titulek</th>
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs">Rok</th>
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs">Cena</th>
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs hidden sm:table-cell">Km</th>
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs hidden md:table-cell">Zdroj</th>
              <th className="py-2 px-3 font-semibold text-gray-600 text-xs hidden md:table-cell">Odkaz</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2 px-3 max-w-[200px] truncate">
                  {item.title || "—"}
                </td>
                <td className="py-2 px-3 tabular-nums">{item.year || "—"}</td>
                <td className="py-2 px-3 font-medium tabular-nums">
                  {item.price > 0
                    ? `${item.price.toLocaleString("cs-CZ")} Kč`
                    : "—"}
                </td>
                <td className="py-2 px-3 tabular-nums hidden sm:table-cell">
                  {item.mileage
                    ? `${item.mileage.toLocaleString("cs-CZ")} km`
                    : "—"}
                </td>
                <td className="py-2 px-3 hidden md:table-cell">
                  <span
                    className={`px-1.5 py-0.5 text-xs rounded ${sourceColors[item.source] || "bg-gray-50 text-gray-700"}`}
                  >
                    {sourceLabels[item.source] || item.source}
                  </span>
                </td>
                <td className="py-2 px-3 hidden md:table-cell">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline text-xs"
                    >
                      Zobrazit
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

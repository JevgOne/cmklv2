"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCompare } from "@/components/web/CompareContext";

interface VehicleDetail {
  id: string;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  enginePower: number | null;
  engineCapacity: number | null;
  bodyType: string | null;
  color: string | null;
  drivetrain: string | null;
  ownerCount: number | null;
  condition: string;
  stkValidUntil: string | null;
  serviceBook: boolean;
  price: number;
  priceNegotiable: boolean;
  trustScore: number;
  equipment: string[];
  city: string;
  slug: string | null;
  photo: string;
}

const fuelLabels: Record<string, string> = {
  PETROL: "Benzin", DIESEL: "Diesel", ELECTRIC: "Elektro", HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in Hybrid", LPG: "LPG", CNG: "CNG",
};

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuál", AUTOMATIC: "Automat", DSG: "DSG", CVT: "CVT",
};

const conditionLabels: Record<string, string> = {
  NEW: "Nové", LIKE_NEW: "Jako nové", EXCELLENT: "Výborný",
  GOOD: "Dobrý", FAIR: "Uspokojivý", DAMAGED: "Poškozené",
};

const bodyTypeLabels: Record<string, string> = {
  SEDAN: "Sedan", HATCHBACK: "Hatchback", COMBI: "Kombi", SUV: "SUV",
  COUPE: "Coupé", CABRIO: "Kabriolet", VAN: "MPV/Van", PICKUP: "Pickup",
};

const drivetrainLabels: Record<string, string> = {
  FWD: "Přední", RWD: "Zadní", AWD: "AWD", "4WD": "4x4",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("cs-CZ").format(price);
}

function formatKm(km: number): string {
  return new Intl.NumberFormat("cs-CZ").format(km);
}

function bestOf(values: (number | null)[], mode: "min" | "max"): boolean[] {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < 2) return values.map(() => false);
  const target = mode === "min" ? Math.min(...valid) : Math.max(...valid);
  return values.map((v) => v === target);
}

export function CompareTable() {
  const { vehicles: compareVehicles, removeVehicle } = useCompare();
  const [details, setDetails] = useState<VehicleDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareVehicles.length === 0) {
      setDetails([]);
      setLoading(false);
      return;
    }

    const ids = compareVehicles.map((v) => v.id);
    Promise.all(
      ids.map((id) =>
        fetch(`/api/vehicles/${id}`).then((r) => {
          if (!r.ok) return null;
          return r.json();
        }),
      ),
    ).then((results) => {
      const loaded: VehicleDetail[] = [];
      for (const r of results) {
        if (!r) continue;
        const v = r.vehicle || r;
        let equip: string[] = [];
        if (v.equipment) {
          try {
            equip = typeof v.equipment === "string" ? JSON.parse(v.equipment) : v.equipment;
          } catch { /* ignore */ }
        }
        const primaryImage = v.images?.[0]?.url || "/images/placeholder-car.jpg";
        loaded.push({
          id: v.id,
          brand: v.brand,
          model: v.model,
          variant: v.variant,
          year: v.year,
          mileage: v.mileage,
          fuelType: v.fuelType,
          transmission: v.transmission,
          enginePower: v.enginePower,
          engineCapacity: v.engineCapacity,
          bodyType: v.bodyType,
          color: v.color,
          drivetrain: v.drivetrain,
          ownerCount: v.ownerCount,
          condition: v.condition,
          stkValidUntil: v.stkValidUntil,
          serviceBook: v.serviceBook,
          price: v.price,
          priceNegotiable: v.priceNegotiable,
          trustScore: v.trustScore,
          equipment: equip,
          city: v.city,
          slug: v.slug,
          photo: primaryImage,
        });
      }
      setDetails(loaded);
      setLoading(false);
    });
  }, [compareVehicles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (details.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">&#x2696;&#xFE0F;</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Zatím nemáte vozy k porovnání</h2>
        <p className="text-gray-500 mb-6">
          V katalogu klikněte na ikonu vah u vozu, který chcete porovnat.
        </p>
        <Link
          href="/nabidka"
          className="inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer transition-all duration-200 py-2.5 px-6 text-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white no-underline"
        >
          Prohlédnout nabídku
        </Link>
      </div>
    );
  }

  const allEquipment = Array.from(
    new Set(details.flatMap((d) => d.equipment)),
  ).sort();

  const prices = details.map((d) => d.price);
  const mileages = details.map((d) => d.mileage);
  const years = details.map((d) => d.year);
  const powers = details.map((d) => d.enginePower);
  const trusts = details.map((d) => d.trustScore);

  const bestPrice = bestOf(prices, "min");
  const bestMileage = bestOf(mileages, "min");
  const bestYear = bestOf(years, "max");
  const bestPower = bestOf(powers, "max");
  const bestTrust = bestOf(trusts, "max");

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr>
            <th className="w-[160px]" />
            {details.map((v) => (
              <th key={v.id} className="p-3 text-left align-top">
                <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className="relative">
                    <img
                      src={v.photo}
                      alt={`${v.brand} ${v.model}`}
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center cursor-pointer border-none hover:bg-red-50 transition-colors"
                      onClick={() => removeVehicle(v.id)}
                      aria-label="Odebrat z porovnání"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4">
                    <Link
                      href={`/nabidka/${v.slug || v.id}`}
                      className="text-base font-bold text-gray-900 hover:text-orange-600 transition-colors no-underline"
                    >
                      {v.brand} {v.model}
                      {v.variant ? ` ${v.variant}` : ""}
                    </Link>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <SectionHeader label="Cena" cols={details.length} />
          <CompareRow
            label="Cena"
            values={details.map((d, i) => ({
              text: `${formatPrice(d.price)} Kč`,
              highlight: bestPrice[i],
            }))}
          />
          <CompareRow
            label="Cena k jednání"
            values={details.map((d) => ({
              text: d.priceNegotiable ? "Ano" : "Ne",
            }))}
          />

          <SectionHeader label="Základní parametry" cols={details.length} />
          <CompareRow
            label="Rok"
            values={details.map((d, i) => ({
              text: String(d.year),
              highlight: bestYear[i],
            }))}
          />
          <CompareRow
            label="Nájezd"
            values={details.map((d, i) => ({
              text: `${formatKm(d.mileage)} km`,
              highlight: bestMileage[i],
            }))}
          />
          <CompareRow
            label="Palivo"
            values={details.map((d) => ({
              text: fuelLabels[d.fuelType] || d.fuelType,
            }))}
          />
          <CompareRow
            label="Převodovka"
            values={details.map((d) => ({
              text: transmissionLabels[d.transmission] || d.transmission,
            }))}
          />
          <CompareRow
            label="Karoserie"
            values={details.map((d) => ({
              text: d.bodyType ? (bodyTypeLabels[d.bodyType] || d.bodyType) : "\u2014",
            }))}
          />
          <CompareRow
            label="Barva"
            values={details.map((d) => ({
              text: d.color || "\u2014",
            }))}
          />
          <CompareRow
            label="Lokace"
            values={details.map((d) => ({
              text: d.city,
            }))}
          />

          <SectionHeader label="Motor" cols={details.length} />
          <CompareRow
            label="Výkon"
            values={details.map((d, i) => ({
              text: d.enginePower ? `${d.enginePower} HP` : "\u2014",
              highlight: bestPower[i],
            }))}
          />
          <CompareRow
            label="Objem"
            values={details.map((d) => ({
              text: d.engineCapacity ? `${d.engineCapacity} ccm` : "\u2014",
            }))}
          />
          <CompareRow
            label="Pohon"
            values={details.map((d) => ({
              text: d.drivetrain ? (drivetrainLabels[d.drivetrain] || d.drivetrain) : "\u2014",
            }))}
          />

          <SectionHeader label="Stav" cols={details.length} />
          <CompareRow
            label="Stav"
            values={details.map((d) => ({
              text: conditionLabels[d.condition] || d.condition,
            }))}
          />
          <CompareRow
            label="STK do"
            values={details.map((d) => {
              if (!d.stkValidUntil) return { text: "\u2014" };
              const date = new Date(d.stkValidUntil);
              return {
                text: `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`,
              };
            })}
          />
          <CompareRow
            label="Servisní knížka"
            values={details.map((d) => ({
              text: d.serviceBook ? "Ano" : "Ne",
            }))}
          />
          <CompareRow
            label="Počet majitelů"
            values={details.map((d) => ({
              text: d.ownerCount ? String(d.ownerCount) : "\u2014",
            }))}
          />
          <CompareRow
            label="Trust Score"
            values={details.map((d, i) => ({
              text: `${d.trustScore}/100`,
              highlight: bestTrust[i],
            }))}
          />

          {allEquipment.length > 0 && (
            <>
              <SectionHeader label="Výbava" cols={details.length} />
              {allEquipment.map((item) => (
                <CompareRow
                  key={item}
                  label={item}
                  values={details.map((d) => ({
                    text: d.equipment.includes(item) ? "check" : "cross",
                    isIcon: true,
                  }))}
                />
              ))}
            </>
          )}
        </tbody>
      </table>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {details.map((v) => (
          <div key={v.id} className="flex flex-col gap-2">
            <Link
              href={`/nabidka/${v.slug || v.id}`}
              className="inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer transition-all duration-200 py-3 px-6 text-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white no-underline hover:-translate-y-0.5"
            >
              Detail — {v.brand} {v.model}
            </Link>
            <Link
              href={`/nabidka/${v.slug || v.id}#kontakt`}
              className="inline-flex items-center justify-center gap-2 font-semibold rounded-full border-2 border-orange-500 cursor-pointer transition-all duration-200 py-3 px-6 text-sm text-orange-600 bg-white no-underline hover:bg-orange-50 hover:-translate-y-0.5"
            >
              Kontaktovat makléře
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ label, cols }: { label: string; cols: number }) {
  return (
    <tr>
      <td
        colSpan={cols + 1}
        className="pt-6 pb-2 px-3 text-sm font-bold text-orange-600 uppercase tracking-wider border-b-2 border-orange-100"
      >
        {label}
      </td>
    </tr>
  );
}

function CompareRow({
  label,
  values,
}: {
  label: string;
  values: { text: string; highlight?: boolean; isIcon?: boolean }[];
}) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-3 px-3 text-sm text-gray-500 font-medium">{label}</td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`py-3 px-3 text-sm font-semibold ${
            v.highlight ? "text-green-700 bg-green-50" : "text-gray-900"
          }`}
        >
          {v.isIcon ? (
            v.text === "check" ? (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-bold">
                &#10003;
              </span>
            ) : (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-red-50 text-red-400 rounded-full text-xs font-bold">
                &#10007;
              </span>
            )
          ) : (
            v.text
          )}
        </td>
      ))}
    </tr>
  );
}

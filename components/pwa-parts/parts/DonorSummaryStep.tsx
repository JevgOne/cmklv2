"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { getGroupName } from "@/lib/tecdoc";
import type { VehicleData } from "./DonorVehicleStep";
import type { PricedPart } from "./BulkPricingStep";
import type { DamageZone, DamageLevel } from "@/lib/damage-zones";

const DISPOSAL_LABELS: Record<string, string> = {
  ACCIDENT: "Nehoda",
  MECHANICAL: "Nepojízdné (mechanická závada)",
  COMPLETE: "Kompletní rozebírání",
  FLOOD: "Zatopené",
  FIRE: "Požár",
};

interface DonorSummaryStepProps {
  vehicle: VehicleData;
  disposalType: string;
  damageZones: Record<DamageZone, DamageLevel>;
  photos: string[];
  parts: PricedPart[];
  onBack: () => void;
}

export function DonorSummaryStep({
  vehicle,
  disposalType,
  damageZones,
  photos,
  parts,
  onBack,
}: DonorSummaryStepProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const totalValue = parts.reduce(
    (sum, p) => sum + (p.priceByAgreement ? 0 : p.price),
    0
  );

  // Group parts by productGroup for summary
  const grouped = new Map<string, { count: number; value: number }>();
  for (const part of parts) {
    const g = grouped.get(part.productGroup) ?? { count: 0, value: 0 };
    g.count += 1;
    g.value += part.priceByAgreement ? 0 : part.price;
    grouped.set(part.productGroup, g);
  }

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      const body = {
        vehicle: {
          vin: vehicle.vin,
          kTypeId: vehicle.kTypeId,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          variant: vehicle.variant,
          engine: vehicle.engine,
          fuel: vehicle.fuel,
          transmission: vehicle.transmission,
        },
        disposalType,
        damageZones,
        photos: photos.filter(Boolean),
        parts: parts.map((p) => ({
          name: p.name,
          category: p.productGroup,
          grade: p.grade,
          price: p.priceByAgreement ? 0 : p.price,
          priceByAgreement: p.priceByAgreement,
          note: p.note || undefined,
          photo: p.photo || undefined,
          tecdocArticleId: p.articleId,
          tecdocProductGroup: p.productGroup,
        })),
      };

      const res = await fetch("/api/donor-vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/parts/donors/${data.donorVehicle.id}`);
      } else {
        // Fallback — redirect to parts list
        router.push("/parts/my");
      }
    } catch {
      router.push("/parts/my");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Souhrn</h2>
        <span className="text-sm text-gray-500">Krok 7 / 8</span>
      </div>

      {/* Vehicle info */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
        <div className="text-lg font-bold text-gray-900">
          {vehicle.brand} {vehicle.model}
          {vehicle.year && ` (${vehicle.year})`}
        </div>
        <div className="text-sm text-gray-600">VIN: {vehicle.vin}</div>
        <div className="text-sm text-gray-600">
          Typ: {DISPOSAL_LABELS[disposalType] ?? disposalType}
        </div>
        {vehicle.engine && (
          <div className="text-sm text-gray-500">
            Motor: {vehicle.engine}
            {vehicle.fuel && ` · ${vehicle.fuel}`}
            {vehicle.transmission && ` · ${vehicle.transmission}`}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{parts.length}</div>
          <div className="text-xs text-gray-600 mt-1">Dílů k publikaci</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(totalValue)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Celková hodnota</div>
        </div>
      </div>

      {/* Parts by group */}
      <div className="space-y-2 mb-6">
        {Array.from(grouped.entries()).map(([group, { count, value }]) => (
          <div
            key={group}
            className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0"
          >
            <span className="text-gray-700">
              {getGroupName(group)}: {count} {count === 1 ? "díl" : count < 5 ? "díly" : "dílů"}
            </span>
            <span className="font-medium text-gray-900">
              {formatPrice(value)}
            </span>
          </div>
        ))}
      </div>

      {/* Photos count */}
      <div className="text-sm text-gray-500 mb-6">
        Fotky: {photos.filter(Boolean).length} nahráno
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
        >
          Zpět k úpravě
        </button>
        <Button
          variant="primary"
          size="lg"
          onClick={handlePublish}
          disabled={submitting}
          className="flex-1"
        >
          {submitting
            ? "Publikuji..."
            : `Publikovat ${parts.length} dílů`}
        </Button>
      </div>
    </div>
  );
}

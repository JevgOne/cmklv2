"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { StepLayout } from "./StepLayout";
import { EquipmentSelector } from "./EquipmentSelector";
import type { VinDecoderResult } from "@/types/vehicle-draft";

export function EquipmentStep() {
  const router = useRouter();
  const { draft, updateSection, saveDraft } = useDraftContext();

  const vinDecoded = draft?.vin?.decodedData as VinDecoderResult | undefined;

  const [equipment, setEquipment] = useState<string[]>(
    () => draft?.details?.equipment ?? vinDecoded?.equipment ?? []
  );

  const handleNext = useCallback(async () => {
    updateSection("details", {
      ...(draft?.details ?? {}),
      equipment,
    });
    await saveDraft();
    router.push(`/makler/vehicles/new/pricing?draft=${draft?.id}`);
  }, [equipment, updateSection, saveDraft, router, draft?.id, draft?.details]);

  const handleBack = () => {
    // Save current state before going back
    updateSection("details", {
      ...(draft?.details ?? {}),
      equipment,
    });
    router.push(`/makler/vehicles/new/details?draft=${draft?.id}`);
  };

  return (
    <StepLayout
      step={6}
      title="Výbava"
      onNext={handleNext}
      onBack={handleBack}
      showSave
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Zaškrtněte výbavu, kterou vůz obsahuje. Čím přesnější údaje, tím lepší inzerát.
        </p>

        {equipment.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <span className="text-sm font-semibold text-orange-700">
              {equipment.length} položek vybráno
            </span>
          </div>
        )}

        <EquipmentSelector
          selectedEquipment={equipment}
          vinEquipment={vinDecoded?.equipment}
          onChange={setEquipment}
        />
      </div>
    </StepLayout>
  );
}

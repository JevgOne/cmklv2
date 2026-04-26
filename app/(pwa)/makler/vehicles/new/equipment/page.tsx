"use client";

import { EquipmentStep } from "@/components/pwa/vehicles/new/EquipmentStep";
import { StepPageGuard } from "@/components/pwa/vehicles/new/StepPageGuard";

export default function EquipmentPage() {
  return (
    <StepPageGuard>
      <EquipmentStep />
    </StepPageGuard>
  );
}

"use client";

import { VinStep } from "@/components/pwa/vehicles/new/VinStep";
import { StepPageGuard } from "@/components/pwa/vehicles/new/StepPageGuard";

export default function VinPage() {
  return (
    <StepPageGuard>
      <VinStep />
    </StepPageGuard>
  );
}

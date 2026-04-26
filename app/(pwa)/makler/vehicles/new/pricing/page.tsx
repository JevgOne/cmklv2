"use client";

import { PricingStep } from "@/components/pwa/vehicles/new/PricingStep";
import { StepPageGuard } from "@/components/pwa/vehicles/new/StepPageGuard";

export default function PricingPage() {
  return (
    <StepPageGuard>
      <PricingStep />
    </StepPageGuard>
  );
}

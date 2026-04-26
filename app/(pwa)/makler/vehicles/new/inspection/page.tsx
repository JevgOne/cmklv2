"use client";

import { InspectionStep } from "@/components/pwa/vehicles/new/InspectionStep";
import { StepPageGuard } from "@/components/pwa/vehicles/new/StepPageGuard";

export default function InspectionPage() {
  return (
    <StepPageGuard>
      <InspectionStep />
    </StepPageGuard>
  );
}

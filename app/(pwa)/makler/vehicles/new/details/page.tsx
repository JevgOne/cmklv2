"use client";

import { DetailsStep } from "@/components/pwa/vehicles/new/DetailsStep";
import { StepPageGuard } from "@/components/pwa/vehicles/new/StepPageGuard";

export default function DetailsPage() {
  return (
    <StepPageGuard>
      <DetailsStep />
    </StepPageGuard>
  );
}

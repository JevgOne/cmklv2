"use client";

import { ReviewStep } from "@/components/pwa/vehicles/new/ReviewStep";
import { StepPageGuard } from "@/components/pwa/vehicles/new/StepPageGuard";

export default function ReviewPage() {
  return (
    <StepPageGuard>
      <ReviewStep />
    </StepPageGuard>
  );
}

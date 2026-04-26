"use client";

import { PhotosStep } from "@/components/pwa/vehicles/new/PhotosStep";
import { StepPageGuard } from "@/components/pwa/vehicles/new/StepPageGuard";

export default function PhotosPage() {
  return (
    <StepPageGuard>
      <PhotosStep />
    </StepPageGuard>
  );
}

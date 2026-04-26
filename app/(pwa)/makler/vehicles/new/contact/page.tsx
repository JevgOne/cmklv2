"use client";

import { ContactStep } from "@/components/pwa/vehicles/new/ContactStep";
import { StepPageGuard } from "@/components/pwa/vehicles/new/StepPageGuard";

export default function ContactPage() {
  return (
    <StepPageGuard>
      <ContactStep />
    </StepPageGuard>
  );
}

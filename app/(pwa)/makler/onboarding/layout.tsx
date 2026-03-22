"use client";

import { usePathname } from "next/navigation";
import { OnboardingProgress, type OnboardingStep } from "@/components/pwa/onboarding/OnboardingProgress";

const STEP_MAP: Record<string, OnboardingStep> = {
  "/makler/onboarding/profile": "profile",
  "/makler/onboarding/documents": "documents",
  "/makler/onboarding/training": "training",
  "/makler/onboarding/contract": "contract",
  "/makler/onboarding/approval": "approval",
};

const STEP_ORDER: OnboardingStep[] = ["profile", "documents", "training", "contract", "approval"];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStep = STEP_MAP[pathname] || "profile";
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const completedSteps = STEP_ORDER.slice(0, currentIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900 mb-4">Onboarding maklere</h1>
          <OnboardingProgress currentStep={currentStep} completedSteps={completedSteps} />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

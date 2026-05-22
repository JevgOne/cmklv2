"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { StepProgressBar } from "./StepProgressBar";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { OnboardingTour } from "./OnboardingTour";

const STEP_ROUTES = ["vin", "contact", "inspection", "photos", "details", "equipment", "pricing", "review"];

interface StepLayoutProps {
  step: number;
  title: string;
  children: React.ReactNode;
  onNext?: () => void | Promise<void>;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showSave?: boolean;
  totalSteps?: number;
}

export function StepLayout({
  step,
  title,
  children,
  onNext,
  onBack,
  nextLabel = "Pokračovat",
  nextDisabled = false,
  showSave = false,
  totalSteps = 8,
}: StepLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { draft, saveDraft, saveStatus } = useDraftContext();
  const draftId = draft?.id || searchParams.get("draft") || "";

  // Track highest visited step for clickable navigation
  const [highestVisited, setHighestVisited] = useState(step);
  useEffect(() => {
    setHighestVisited((prev) => Math.max(prev, step));
  }, [step]);

  // Also check draft.currentStep for persisted progress
  useEffect(() => {
    if (draft?.currentStep) {
      setHighestVisited((prev) => Math.max(prev, draft.currentStep));
    }
  }, [draft?.currentStep]);

  // Build completed steps set: all steps before current that have been visited
  const completedSteps = new Set<number>();
  for (let i = 1; i < step; i++) {
    completedSteps.add(i);
  }

  // Check if this is a first-time broker (for time estimates)
  const [showTimeEstimates, setShowTimeEstimates] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem("onboarding_vehicle_count");
      setShowTimeEstimates(!completed || parseInt(completed, 10) < 3);
    }
  }, []);

  const handleStepClick = useCallback(
    (targetStep: number) => {
      if (targetStep === step) return;
      // Only allow navigation to visited steps
      if (targetStep > highestVisited) return;
      const route = STEP_ROUTES[targetStep - 1];
      if (route) {
        router.push(`/makler/vehicles/new/${route}?draft=${draftId}`);
      }
    },
    [step, highestVisited, draftId, router]
  );

  const handleClose = async () => {
    await saveDraft();
    router.push("/makler/dashboard");
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Save status indicator
  const SaveIndicator = () => {
    if (saveStatus === "saving") {
      return (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
          <span>Ukládám...</span>
        </div>
      );
    }
    if (saveStatus === "saved") {
      return (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <span className="inline-flex rounded-full h-2 w-2 bg-green-500" />
          <span>Uloženo</span>
        </div>
      );
    }
    if (saveStatus === "offline") {
      return (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
          <span className="inline-flex rounded-full h-2 w-2 bg-red-500" />
          <span>Offline</span>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <OnboardingTour />
      <div className="flex flex-col min-h-[100dvh] bg-white">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-[env(safe-area-inset-top)]">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              {/* Šipka zpět */}
              <button
                onClick={handleBack}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Zpět"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>

              {/* Název kroku + save indicator */}
              <div className="flex flex-col items-center">
                <h1 className="text-lg font-bold text-gray-900">{title}</h1>
                <SaveIndicator />
              </div>

              {/* Křížek - zavřít a uložit */}
              <button
                onClick={handleClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Zavřít"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <StepProgressBar
              currentStep={step}
              totalSteps={totalSteps}
              completedSteps={completedSteps}
              onStepClick={handleStepClick}
              showTimeEstimates={showTimeEstimates}
            />
          </div>
        </div>

        {/* Obsah */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {children}
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="flex gap-3">
            {showSave && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={saveDraft}
              >
                Uložit draft
              </Button>
            )}
            {onNext && (
              <Button
                variant="primary"
                className="flex-1"
                onClick={onNext}
                disabled={nextDisabled}
              >
                {nextLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

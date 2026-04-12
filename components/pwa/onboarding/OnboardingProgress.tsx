"use client";

import { cn } from "@/lib/utils";

export type OnboardingStep = "profile" | "documents" | "training" | "contract" | "approval";

interface StepConfig {
  key: OnboardingStep;
  label: string;
  icon: string;
}

const STEPS: StepConfig[] = [
  { key: "profile", label: "Profil", icon: "1" },
  { key: "documents", label: "Dokumenty", icon: "2" },
  { key: "training", label: "Školení", icon: "3" },
  { key: "contract", label: "Smlouva", icon: "4" },
  { key: "approval", label: "Schválení", icon: "5" },
];

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
  completedSteps?: OnboardingStep[];
}

export function OnboardingProgress({ currentStep, completedSteps = [] }: OnboardingProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  function getStepState(step: StepConfig, index: number): "completed" | "active" | "pending" {
    if (completedSteps.includes(step.key)) return "completed";
    if (index === currentIndex) return "active";
    return "pending";
  }

  return (
    <div className="w-full">
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-center justify-between gap-2">
        {STEPS.map((step, i) => {
          const state = getStepState(step, i);
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                    state === "completed" && "bg-success-500 text-white",
                    state === "active" && "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange",
                    state === "pending" && "bg-gray-200 text-gray-500"
                  )}
                >
                  {state === "completed" ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    state === "completed" && "text-success-600",
                    state === "active" && "text-orange-600 font-semibold",
                    state === "pending" && "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3 mt-[-20px] rounded-full transition-colors duration-300",
                    completedSteps.includes(step.key) ? "bg-success-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact horizontal */}
      <div className="flex sm:hidden items-center gap-2">
        {STEPS.map((step, i) => {
          const state = getStepState(step, i);
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                    state === "completed" && "bg-success-500 text-white",
                    state === "active" && "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
                    state === "pending" && "bg-gray-200 text-gray-500"
                  )}
                >
                  {state === "completed" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium whitespace-nowrap",
                    state === "completed" && "text-success-600",
                    state === "active" && "text-orange-600 font-semibold",
                    state === "pending" && "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1 mt-[-16px] rounded-full transition-colors duration-300",
                    completedSteps.includes(step.key) ? "bg-success-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

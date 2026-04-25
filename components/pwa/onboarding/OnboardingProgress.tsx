"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type OnboardingStep = "profile" | "documents" | "training" | "contract" | "approval";

interface StepConfig {
  key: OnboardingStep;
  label: string;
  icon: string;
}

const STEPS: StepConfig[] = [
  { key: "profile", label: "Profil", icon: "1" },
  { key: "documents", label: "Dokumenty", icon: "2" },
  { key: "training", label: "Skoleni", icon: "3" },
  { key: "contract", label: "Smlouva", icon: "4" },
  { key: "approval", label: "Schvaleni", icon: "5" },
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
                <motion.div
                  initial={false}
                  animate={
                    state === "active"
                      ? { scale: [1, 1.15, 1], boxShadow: "0 0 0 4px rgba(249, 115, 22, 0.2)" }
                      : { scale: 1, boxShadow: "0 0 0 0px rgba(249, 115, 22, 0)" }
                  }
                  transition={
                    state === "active"
                      ? { scale: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
                      : { duration: 0.3 }
                  }
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                    state === "completed" && "bg-success-500 text-white",
                    state === "active" && "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange",
                    state === "pending" && "bg-gray-200 text-gray-500"
                  )}
                >
                  {state === "completed" ? (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  ) : (
                    step.icon
                  )}
                </motion.div>
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
                <div className="flex-1 h-0.5 mx-3 mt-[-20px] rounded-full bg-gray-200 overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: completedSteps.includes(step.key) ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-success-500 origin-left"
                  />
                </div>
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
                <motion.div
                  initial={false}
                  animate={
                    state === "active"
                      ? { scale: [1, 1.15, 1] }
                      : { scale: 1 }
                  }
                  transition={
                    state === "active"
                      ? { repeat: Infinity, duration: 2, ease: "easeInOut" }
                      : { duration: 0.3 }
                  }
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    state === "completed" && "bg-success-500 text-white",
                    state === "active" && "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
                    state === "pending" && "bg-gray-200 text-gray-500"
                  )}
                >
                  {state === "completed" ? (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  ) : (
                    step.icon
                  )}
                </motion.div>
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
                <div className="flex-1 h-0.5 mx-1 mt-[-16px] rounded-full bg-gray-200 overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: completedSteps.includes(step.key) ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full bg-success-500 origin-left"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

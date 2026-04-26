"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";

const STEP_LABELS = ["VIN", "Kontakt", "Prohlídka", "Fotky", "Detaily", "Výbava", "Cena", "Shrnutí"];

interface StepProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export function StepProgressBar({ currentStep, totalSteps = 8 }: StepProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-gray-500">
        <span>Krok {currentStep} / {totalSteps}</span>
        <span>{Math.round(progress)} %</span>
      </div>
      <ProgressBar value={progress} />
      <div className="flex justify-between">
        {STEP_LABELS.slice(0, totalSteps).map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isDone = stepNum < currentStep;
          return (
            <span
              key={label}
              className={`text-[9px] font-medium tracking-wide transition-colors ${
                isActive
                  ? "text-orange-500 font-bold"
                  : isDone
                    ? "text-gray-500"
                    : "text-gray-300"
              }`}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

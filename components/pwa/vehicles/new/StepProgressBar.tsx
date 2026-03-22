"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";

interface StepProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export function StepProgressBar({ currentStep, totalSteps = 7 }: StepProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-gray-500">
        <span>Krok {currentStep} / {totalSteps}</span>
        <span>{Math.round(progress)} %</span>
      </div>
      <ProgressBar value={progress} />
    </div>
  );
}

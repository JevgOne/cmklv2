"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Fotky" },
  { number: 2, label: "Údaje" },
  { number: 3, label: "Cena" },
];

export function AddPartWizard({
  currentStep,
  children,
}: {
  currentStep: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Step indicator */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    step.number <= currentStep
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  {step.number < currentStep ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    step.number <= currentStep ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 rounded-full",
                    step.number < currentStep ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto">{children}</div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

const SINGLE_STEPS = [
  { number: 1, label: "Fotky" },
  { number: 2, label: "Údaje" },
  { number: 3, label: "Cena" },
];

const DONOR_STEPS = [
  { number: 1, label: "VIN" },
  { number: 2, label: "Typ" },
  { number: 3, label: "Poškození" },
  { number: 4, label: "Díly" },
  { number: 5, label: "Fotky" },
  { number: 6, label: "Ceny" },
  { number: 7, label: "Souhrn" },
];

export function AddPartWizard({
  currentStep,
  mode = "single",
  children,
}: {
  currentStep: number;
  mode?: "single" | "donor";
  children: React.ReactNode;
}) {
  const steps = mode === "donor" ? DONOR_STEPS : SINGLE_STEPS;

  return (
    <div className="min-h-screen bg-white">
      {/* Step indicator */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-1 max-w-lg mx-auto">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center gap-1 flex-1">
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    step.number <= currentStep
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  {step.number < currentStep ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium hidden sm:inline",
                    step.number <= currentStep ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 rounded-full min-w-2",
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

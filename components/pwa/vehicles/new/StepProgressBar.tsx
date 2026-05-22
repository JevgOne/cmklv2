"use client";

const STEP_LABELS = ["VIN", "Kontakt", "Prohlídka", "Fotky", "Detaily", "Výbava", "Cena & popis", "Shrnutí"];
const STEP_TIMES = ["~1 min", "~2 min", "~5 min", "~10 min", "~2 min", "~3 min", "~2 min", "~1 min"];

export type StepStatus = "pending" | "in-progress" | "complete" | "warning";

interface StepProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  completedSteps?: Set<number>;
  warningSteps?: Set<number>;
  onStepClick?: (step: number) => void;
  showTimeEstimates?: boolean;
}

export function StepProgressBar({
  currentStep,
  totalSteps = 8,
  completedSteps,
  warningSteps,
  onStepClick,
  showTimeEstimates = false,
}: StepProgressBarProps) {
  const getStatus = (stepNum: number): StepStatus => {
    if (warningSteps?.has(stepNum)) return "warning";
    if (completedSteps?.has(stepNum)) return "complete";
    if (stepNum === currentStep) return "in-progress";
    return "pending";
  };

  const isClickable = (stepNum: number): boolean => {
    if (!onStepClick) return false;
    // Can click completed steps or current step
    if (completedSteps?.has(stepNum)) return true;
    if (stepNum === currentStep) return true;
    // Can click next step after current (sequential navigation)
    return false;
  };

  return (
    <div className="space-y-1.5">
      {/* Step counter */}
      <div className="flex items-center justify-between text-xs font-medium text-gray-500">
        <span>Krok {currentStep} / {totalSteps}</span>
        <span>{Math.round((currentStep / totalSteps) * 100)} %</span>
      </div>

      {/* Step dots + connectors */}
      <div className="flex items-center gap-0">
        {STEP_LABELS.slice(0, totalSteps).map((label, i) => {
          const stepNum = i + 1;
          const status = getStatus(stepNum);
          const clickable = isClickable(stepNum);

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              {/* Step dot */}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(stepNum)}
                className={`
                  relative flex-shrink-0 flex items-center justify-center
                  w-6 h-6 rounded-full text-[10px] font-bold
                  transition-all duration-200
                  ${clickable ? "cursor-pointer" : "cursor-default"}
                  ${status === "complete"
                    ? "bg-green-500 text-white shadow-sm"
                    : status === "in-progress"
                      ? "bg-orange-500 text-white shadow-md ring-2 ring-orange-200"
                      : status === "warning"
                        ? "bg-yellow-400 text-yellow-900 shadow-sm"
                        : "bg-gray-200 text-gray-400"
                  }
                  ${clickable && status !== "in-progress" ? "hover:scale-110 active:scale-95" : ""}
                `}
                aria-label={`${label} — ${status === "complete" ? "dokončeno" : status === "in-progress" ? "aktuální" : status === "warning" ? "vyžaduje pozornost" : "čeká"}`}
              >
                {status === "complete" ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : status === "warning" ? (
                  <span>!</span>
                ) : (
                  <span>{stepNum}</span>
                )}
              </button>

              {/* Connector line between dots (not after last) */}
              {i < totalSteps - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-0.5 transition-colors duration-200 ${
                    stepNum < currentStep || completedSteps?.has(stepNum)
                      ? "bg-green-400"
                      : stepNum === currentStep
                        ? "bg-orange-300"
                        : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels row */}
      <div className="flex justify-between">
        {STEP_LABELS.slice(0, totalSteps).map((label, i) => {
          const stepNum = i + 1;
          const status = getStatus(stepNum);
          return (
            <div key={label} className="flex flex-col items-center" style={{ width: `${100 / totalSteps}%` }}>
              <span
                className={`text-[9px] font-medium tracking-wide transition-colors leading-tight ${
                  status === "in-progress"
                    ? "text-orange-500 font-bold"
                    : status === "complete"
                      ? "text-green-600"
                      : status === "warning"
                        ? "text-yellow-600"
                        : "text-gray-300"
                }`}
              >
                {label}
              </span>
              {showTimeEstimates && status === "pending" && (
                <span className="text-[8px] text-gray-300 leading-tight">{STEP_TIMES[i]}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

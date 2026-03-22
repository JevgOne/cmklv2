import { cn } from "@/lib/utils";

export type FlipStep = "APPROVED" | "FUNDING" | "FUNDED" | "IN_REPAIR" | "FOR_SALE" | "SOLD" | "COMPLETED";

interface TimelineStep {
  key: FlipStep;
  label: string;
  icon: string;
}

const steps: TimelineStep[] = [
  { key: "APPROVED", label: "Schvaleno", icon: "✓" },
  { key: "FUNDING", label: "Financovani", icon: "💰" },
  { key: "FUNDED", label: "Financovano", icon: "✓" },
  { key: "IN_REPAIR", label: "Oprava", icon: "🔧" },
  { key: "FOR_SALE", label: "Prodej", icon: "🏷️" },
  { key: "SOLD", label: "Prodano", icon: "🤝" },
  { key: "COMPLETED", label: "Vyplaceno", icon: "🎉" },
];

const stepOrder: Record<FlipStep, number> = {
  APPROVED: 0,
  FUNDING: 1,
  FUNDED: 2,
  IN_REPAIR: 3,
  FOR_SALE: 4,
  SOLD: 5,
  COMPLETED: 6,
};

export interface FlipTimelineProps {
  currentStep: FlipStep;
  className?: string;
}

export function FlipTimeline({ currentStep, className }: FlipTimelineProps) {
  const currentIndex = stepOrder[currentStep] ?? 0;

  return (
    <div className={cn("", className)}>
      {/* Desktop */}
      <div className="hidden md:flex items-center">
        {steps.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all",
                    isDone && "bg-success-500 text-white",
                    isActive && "bg-orange-500 text-white shadow-orange",
                    isPending && "bg-gray-200 text-gray-400"
                  )}
                >
                  {isDone ? "✓" : step.icon}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold mt-2 text-center",
                    isDone && "text-success-500",
                    isActive && "text-orange-500",
                    isPending && "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-[-16px]",
                    i < currentIndex ? "bg-success-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {steps.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    isDone && "bg-success-500 text-white",
                    isActive && "bg-orange-500 text-white",
                    isPending && "bg-gray-200 text-gray-400"
                  )}
                >
                  {isDone ? "✓" : step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-4",
                      i < currentIndex ? "bg-success-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isDone && "text-success-500",
                  isActive && "text-orange-500 font-bold",
                  isPending && "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

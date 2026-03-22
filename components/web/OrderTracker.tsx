import { cn } from "@/lib/utils";

const STEPS = [
  { key: "NEW", label: "Přijata" },
  { key: "CONFIRMED", label: "Potvrzena" },
  { key: "PACKING", label: "Balení" },
  { key: "SHIPPED", label: "Odesláno" },
  { key: "DELIVERED", label: "Doručeno" },
] as const;

type OrderStatus = "NEW" | "CONFIRMED" | "PACKING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export function OrderTracker({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  if (status === "CANCELLED") {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <span className="w-3 h-3 bg-red-500 rounded-full" />
        <span className="font-semibold text-red-600">Zrušena</span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {STEPS.map((step, i) => {
        const isCompleted = i <= currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.key} className="flex items-center gap-1 flex-1">
            {/* Dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-3 h-3 rounded-full shrink-0 transition-colors",
                  isCompleted
                    ? "bg-orange-500"
                    : "bg-gray-200",
                  isCurrent && "ring-4 ring-orange-100"
                )}
              />
              <span
                className={cn(
                  "text-[10px] mt-1 whitespace-nowrap",
                  isCompleted ? "text-orange-600 font-semibold" : "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Line */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 rounded-full mb-4",
                  i < currentIndex ? "bg-orange-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

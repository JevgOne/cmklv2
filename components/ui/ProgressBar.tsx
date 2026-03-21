import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number;
  variant?: "default" | "green" | "blue";
  className?: string;
}

const barStyles = {
  default: "bg-gradient-to-r from-orange-500 to-orange-600",
  green: "bg-success-500",
  blue: "bg-info-500",
};

export function ProgressBar({ value, variant = "default", className }: ProgressBarProps) {
  return (
    <div className={cn("h-2 bg-gray-200 rounded-full overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-300 ease-in-out", barStyles[variant])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

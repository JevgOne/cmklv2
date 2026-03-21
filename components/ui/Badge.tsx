import { cn } from "@/lib/utils";

export interface BadgeProps {
  variant?: "verified" | "top" | "live" | "new" | "pending" | "rejected" | "default";
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  verified: "bg-success-50 text-success-500",
  top: "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
  live: "bg-gray-900 text-white",
  new: "bg-info-50 text-info-500",
  pending: "bg-warning-50 text-warning-500",
  rejected: "bg-error-50 text-error-500",
  default: "bg-gray-100 text-gray-600",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-bold", variantStyles[variant], className)}>
      {variant === "live" && (
        <span className="w-2 h-2 bg-error-500 rounded-full animate-[pulse-dot_1.5s_infinite]" />
      )}
      {children}
    </span>
  );
}

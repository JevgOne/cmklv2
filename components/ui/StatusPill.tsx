import { cn } from "@/lib/utils";

export interface StatusPillProps {
  variant: "active" | "pending" | "rejected" | "draft" | "sold";
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  active: "bg-success-50 text-success-600",
  pending: "bg-warning-50 text-warning-500",
  rejected: "bg-error-50 text-error-500",
  draft: "bg-gray-100 text-gray-600",
  sold: "bg-info-50 text-info-500",
};

export function StatusPill({ variant, children, className }: StatusPillProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", variantStyles[variant], className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

import { cn } from "@/lib/utils";

export interface AlertProps {
  variant: "success" | "error" | "warning" | "info";
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  success: "bg-success-50 text-success-600",
  error: "bg-error-50 text-error-600",
  warning: "bg-warning-50 text-warning-500",
  info: "bg-info-50 text-info-500",
};

export function Alert({ variant, children, className }: AlertProps) {
  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-lg", variantStyles[variant], className)}>
      {children}
    </div>
  );
}

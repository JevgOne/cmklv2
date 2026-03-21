import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "danger";
  size?: "sm" | "default" | "lg";
  icon?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  primary: "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange hover:-translate-y-0.5 hover:shadow-orange-hover",
  secondary: "bg-gray-900 text-white hover:bg-gray-800 hover:-translate-y-0.5",
  outline: "bg-white text-gray-800 shadow-[inset_0_0_0_2px_var(--gray-200)] hover:bg-gray-50 hover:shadow-[inset_0_0_0_2px_var(--gray-300)]",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  success: "bg-success-500 text-white hover:bg-success-600",
  danger: "bg-error-500 text-white hover:bg-error-600",
};

const sizeStyles = {
  sm: "py-2 px-4 text-[13px]",
  default: "py-3 px-6 text-[15px]",
  lg: "py-4 px-8 text-[17px]",
};

export function Button({ variant = "primary", size = "default", icon = false, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer transition-all duration-200 whitespace-nowrap",
        variantStyles[variant],
        icon ? "w-[44px] h-[44px] p-0 rounded-lg" : sizeStyles[size],
        disabled && "opacity-50 cursor-not-allowed hover:!transform-none",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

import React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className={cn("flex items-center gap-3 cursor-pointer", className)}>
        <input
          ref={ref}
          type="checkbox"
          className="w-5 h-5 accent-orange-500 cursor-pointer"
          {...props}
        />
        {label && <span className="text-sm text-gray-700">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

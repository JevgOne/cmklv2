import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, children, id: idProp, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp || generatedId;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={id} className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full px-[18px] py-3.5 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all duration-200 cursor-pointer appearance-none pr-12",
            "hover:bg-gray-100",
            "focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none",
            error && "border-error-500",
            className
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23A1A1AA' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
            backgroundSize: "20px",
          }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="text-[13px] text-error-500">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";

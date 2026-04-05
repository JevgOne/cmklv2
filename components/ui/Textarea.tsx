import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id: idProp, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp || generatedId;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={id} className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "w-full px-[18px] py-3.5 text-[15px] font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg transition-all duration-200 min-h-[120px] resize-y",
            "hover:bg-gray-100",
            "focus:bg-white focus:border-orange-500 focus:shadow-[0_0_0_4px_var(--orange-100)] focus:outline-none",
            error && "border-error-500",
            className
          )}
          {...props}
        />
        {error && (
          <span id={errorId} role="alert" className="text-[13px] text-error-500">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

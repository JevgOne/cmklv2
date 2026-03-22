"use client";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: "sm" | "default" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-6 h-6",
  default: "w-8 h-8",
  lg: "w-10 h-10",
};

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "default",
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110 active:scale-95"
          aria-label={`${star} z ${max} hvezdicek`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={star <= value ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={star <= value ? 0 : 1.5}
            className={cn(
              sizeMap[size],
              star <= value ? "text-orange-500" : "text-gray-300"
            )}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

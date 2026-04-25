import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LEVEL_CONFIG: Record<string, { name: string; colors: string; icon: string }> = {
  TIPAR: {
    name: "Tipař",
    colors: "bg-gray-100 text-gray-600 border-gray-300",
    icon: "starter",
  },
  JUNIOR: {
    name: "Junior",
    colors: "bg-amber-100 text-amber-700 border-amber-300",
    icon: "bronze",
  },
  SENIOR: {
    name: "Senior",
    colors: "bg-yellow-100 text-yellow-700 border-yellow-400",
    icon: "gold",
  },
  EXPERT: {
    name: "Expert",
    colors: "bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 border-blue-400",
    icon: "diamond",
  },
};

const sizeStyles = {
  sm: "text-[10px] px-2 py-0.5 gap-1",
  md: "text-xs px-3 py-1 gap-1.5",
  lg: "text-sm px-4 py-1.5 gap-2",
};

const iconSizes = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

function LevelIcon({ level, size }: { level: string; size: "sm" | "md" | "lg" }) {
  const sizeClass = iconSizes[size];

  if (level === "EXPERT") {
    return (
      <svg className={sizeClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
      </svg>
    );
  }
  if (level === "SENIOR") {
    return (
      <svg className={sizeClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
      </svg>
    );
  }
  if (level === "JUNIOR") {
    return (
      <svg className={sizeClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
      </svg>
    );
  }
  // TIPAR
  return (
    <svg className={sizeClass} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" />
    </svg>
  );
}

export function LevelBadge({ level, size = "md", className }: LevelBadgeProps) {
  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.TIPAR;

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold rounded-full border",
        config.colors,
        sizeStyles[size],
        className
      )}
    >
      <LevelIcon level={level} size={size} />
      {config.name}
    </span>
  );
}

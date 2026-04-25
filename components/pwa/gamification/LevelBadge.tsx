import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LEVEL_CONFIG: Record<string, { name: string; stars: number; colors: string }> = {
  STAR_1: {
    name: "Makléř",
    stars: 1,
    colors: "bg-gray-100 text-gray-600 border-gray-300",
  },
  STAR_2: {
    name: "Makléř",
    stars: 2,
    colors: "bg-amber-100 text-amber-700 border-amber-300",
  },
  STAR_3: {
    name: "Makléř",
    stars: 3,
    colors: "bg-yellow-100 text-yellow-700 border-yellow-400",
  },
  STAR_4: {
    name: "Makléř",
    stars: 4,
    colors: "bg-orange-100 text-orange-700 border-orange-400",
  },
  STAR_5: {
    name: "Makléř",
    stars: 5,
    colors: "bg-gradient-to-br from-orange-100 to-red-100 text-orange-700 border-orange-500",
  },
};

const sizeStyles = {
  sm: "text-[10px] px-2 py-0.5 gap-1",
  md: "text-xs px-3 py-1 gap-1.5",
  lg: "text-sm px-4 py-1.5 gap-2",
};

function StarIcons({ count, size }: { count: number; size: "sm" | "md" | "lg" }) {
  const starSizes = { sm: "text-[10px]", md: "text-xs", lg: "text-sm" };
  return <span className={starSizes[size]}>{"⭐".repeat(count)}</span>;
}

export function LevelBadge({ level, size = "md", className }: LevelBadgeProps) {
  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.STAR_1;

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold rounded-full border",
        config.colors,
        sizeStyles[size],
        className
      )}
    >
      <StarIcons count={config.stars} size={size} />
      {config.name}
    </span>
  );
}

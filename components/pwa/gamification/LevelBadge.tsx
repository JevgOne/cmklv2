import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LEVEL_CONFIG: Record<string, { name: string; stars: number; gradient: string; starColor: string; border: string; textColor: string }> = {
  STAR_1: {
    name: "Makléř",
    stars: 1,
    gradient: "from-gray-50 to-gray-100",
    starColor: "#9CA3AF",
    border: "border-gray-200",
    textColor: "text-gray-600",
  },
  STAR_2: {
    name: "Makléř",
    stars: 2,
    gradient: "from-amber-50 to-amber-100",
    starColor: "#D97706",
    border: "border-amber-200",
    textColor: "text-amber-700",
  },
  STAR_3: {
    name: "Makléř",
    stars: 3,
    gradient: "from-yellow-50 to-orange-50",
    starColor: "#F59E0B",
    border: "border-yellow-300",
    textColor: "text-yellow-700",
  },
  STAR_4: {
    name: "Makléř",
    stars: 4,
    gradient: "from-orange-50 to-orange-100",
    starColor: "#EA580C",
    border: "border-orange-300",
    textColor: "text-orange-700",
  },
  STAR_5: {
    name: "Makléř",
    stars: 5,
    gradient: "from-orange-100 via-red-50 to-amber-50",
    starColor: "#DC2626",
    border: "border-orange-400",
    textColor: "text-orange-800",
  },
};

const sizeStyles = {
  sm: { container: "px-2.5 py-1 gap-1.5", text: "text-[10px]", star: 10, gap: 1 },
  md: { container: "px-3.5 py-1.5 gap-2", text: "text-xs", star: 13, gap: 1.5 },
  lg: { container: "px-4 py-2 gap-2.5", text: "text-sm", star: 16, gap: 2 },
};

function StarIcon({ size, color, filled }: { size: number; color: string; filled: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={`star-grad-${color.replace("#", "")}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.7} />
        </linearGradient>
      </defs>
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill={filled ? `url(#star-grad-${color.replace("#", "")})` : "none"}
        stroke={color}
        strokeWidth={filled ? 0 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LevelBadge({ level, size = "md", className }: LevelBadgeProps) {
  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.STAR_1;
  const s = sizeStyles[size];

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold rounded-full border shadow-sm",
        `bg-gradient-to-br ${config.gradient}`,
        config.border,
        config.textColor,
        s.container,
        className
      )}
    >
      <span className="inline-flex items-center" style={{ gap: s.gap }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            size={s.star}
            color={config.starColor}
            filled={i < config.stars}
          />
        ))}
      </span>
      <span className={cn(s.text, "font-semibold tracking-wide")}>{config.name}</span>
    </span>
  );
}

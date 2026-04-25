"use client";

import { TIER_LABELS, type Tier } from "@/lib/reputation/trust-score";

const TIER_STYLES: Record<Tier, {
  gradientFrom: string;
  gradientTo: string;
  text: string;
  labelBg: string;
  glow: string;
}> = {
  NEW: {
    gradientFrom: "#D1D5DB",
    gradientTo: "#9CA3AF",
    text: "text-gray-500",
    labelBg: "bg-gray-100 text-gray-600",
    glow: "",
  },
  BRONZE: {
    gradientFrom: "#F59E0B",
    gradientTo: "#B45309",
    text: "text-amber-700",
    labelBg: "bg-amber-50 text-amber-700",
    glow: "drop-shadow(0 0 6px rgba(245,158,11,0.3))",
  },
  SILVER: {
    gradientFrom: "#94A3B8",
    gradientTo: "#475569",
    text: "text-slate-600",
    labelBg: "bg-slate-50 text-slate-600",
    glow: "drop-shadow(0 0 6px rgba(148,163,184,0.3))",
  },
  GOLD: {
    gradientFrom: "#FACC15",
    gradientTo: "#CA8A04",
    text: "text-yellow-700",
    labelBg: "bg-yellow-50 text-yellow-700",
    glow: "drop-shadow(0 0 8px rgba(250,204,21,0.4))",
  },
  PLATINUM: {
    gradientFrom: "#A855F7",
    gradientTo: "#7C3AED",
    text: "text-purple-700",
    labelBg: "bg-purple-50 text-purple-700",
    glow: "drop-shadow(0 0 10px rgba(168,85,247,0.4))",
  },
};

interface TrustScoreBadgeProps {
  score: number;
  tier: string;
  size?: "sm" | "md" | "lg";
}

export function TrustScoreBadge({ score, tier, size = "md" }: TrustScoreBadgeProps) {
  const t = (tier as Tier) || "NEW";
  const style = TIER_STYLES[t] ?? TIER_STYLES.NEW;
  const label = TIER_LABELS[t] ?? tier;

  const sizes = {
    sm: { box: 48, font: "text-sm", label: "text-[7px] px-1.5 py-0.5", stroke: 3, r: 18 },
    md: { box: 60, font: "text-lg", label: "text-[8px] px-2 py-0.5", stroke: 3.5, r: 23 },
    lg: { box: 72, font: "text-xl", label: "text-[9px] px-2.5 py-0.5", stroke: 4, r: 28 },
  };
  const s = sizes[size];
  const circumference = 2 * Math.PI * s.r;
  const offset = circumference - (score / 100) * circumference;
  const viewBox = (s.r + s.stroke + 2) * 2;
  const center = s.r + s.stroke + 2;
  const gradId = `trust-grad-${t}`;

  return (
    <div className="relative inline-flex flex-col items-center">
      <div
        className="relative"
        style={{
          width: s.box,
          height: s.box,
          filter: style.glow,
        }}
      >
        <svg
          viewBox={`0 0 ${viewBox} ${viewBox}`}
          className="w-full h-full"
          style={{ transform: "rotate(-90deg)" }}
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={style.gradientFrom} />
              <stop offset="100%" stopColor={style.gradientTo} />
            </linearGradient>
          </defs>
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={s.r}
            fill="none"
            strokeWidth={s.stroke}
            className="stroke-gray-100"
          />
          {/* Progress arc with gradient */}
          <circle
            cx={center}
            cy={center}
            r={s.r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={s.stroke + 0.5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.8s ease-out",
            }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${s.font} font-bold ${style.text}`}>{score}</span>
        </div>
      </div>
      {/* Tier label pill */}
      <span
        className={`${s.label} font-bold uppercase tracking-wider rounded-full mt-1 ${style.labelBg}`}
      >
        {label}
      </span>
    </div>
  );
}

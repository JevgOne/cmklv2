"use client";

import { TIER_LABELS, type Tier } from "@/lib/reputation/trust-score";

const TIER_STYLES: Record<Tier, { ring: string; text: string; bg: string; glow?: string }> = {
  NEW: { ring: "stroke-gray-300", text: "text-gray-500", bg: "bg-gray-50" },
  BRONZE: { ring: "stroke-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  SILVER: { ring: "stroke-slate-400", text: "text-slate-600", bg: "bg-slate-50" },
  GOLD: { ring: "stroke-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50", glow: "shadow-yellow-200/50 shadow-md" },
  PLATINUM: { ring: "stroke-purple-500", text: "text-purple-700", bg: "bg-purple-50", glow: "shadow-purple-200/50 shadow-md" },
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
    sm: { box: "w-12 h-12", font: "text-sm", label: "text-[8px]", stroke: 3, r: 18 },
    md: { box: "w-16 h-16", font: "text-lg", label: "text-[9px]", stroke: 3.5, r: 24 },
    lg: { box: "w-20 h-20", font: "text-xl", label: "text-[10px]", stroke: 4, r: 30 },
  };
  const s = sizes[size];
  const circumference = 2 * Math.PI * s.r;
  const offset = circumference - (score / 100) * circumference;
  const viewBox = (s.r + s.stroke) * 2;
  const center = s.r + s.stroke;

  return (
    <div className={`relative inline-flex flex-col items-center ${style.glow ?? ""}`}>
      <div className={`${s.box} relative`}>
        <svg
          viewBox={`0 0 ${viewBox} ${viewBox}`}
          className="w-full h-full -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={s.r}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-gray-100"
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={s.r}
            fill="none"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={style.ring}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${s.font} font-bold ${style.text}`}>{score}</span>
        </div>
      </div>
      {/* Tier label */}
      <span className={`${s.label} font-semibold uppercase tracking-wider mt-0.5 ${style.text}`}>
        {label}
      </span>
    </div>
  );
}

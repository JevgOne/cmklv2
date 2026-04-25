"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { LevelBadge } from "@/components/pwa/gamification/LevelBadge";
import type { Feature } from "@/lib/feature-gates";
import { FEATURE_INFO, getUnlockLevel, TIER_INFO } from "@/lib/feature-gates";

interface LockedFeatureCardProps {
  feature: Feature;
  percentage?: number;
  revenueNeeded?: number;
  compact?: boolean;
  fullscreen?: boolean;
  className?: string;
}

export function LockedFeatureCard({
  feature,
  percentage = 0,
  revenueNeeded = 0,
  compact = false,
  fullscreen = false,
  className,
}: LockedFeatureCardProps) {
  const info = FEATURE_INFO[feature];
  const unlockLevel = getUnlockLevel(feature);
  const tierInfo = TIER_INFO[unlockLevel];

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`p-4 relative overflow-hidden ${className ?? ""}`}>
          <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-[2px]" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-lg shrink-0">
              🔒
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-700 text-sm">{info.name}</p>
              <p className="text-xs text-gray-500 truncate">{info.description}</p>
            </div>
            <LevelBadge level={unlockLevel} size="sm" />
          </div>
          <div className="relative z-10 mt-3">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${fullscreen ? "flex items-center justify-center min-h-[60vh] p-4" : ""} ${className ?? ""}`}
    >
      <Card className="p-6 relative overflow-hidden max-w-md w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/90 to-white/80 backdrop-blur-[3px]" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mb-4">
            🔒
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1">{info.name}</h3>
          <p className="text-sm text-gray-500 mb-4">{info.description}</p>

          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1.5">Dostupné od úrovně</p>
            <LevelBadge level={unlockLevel} size="md" />
            <p className="text-xs text-gray-500 mt-1">{tierInfo.displayName}</p>
          </div>

          <div className="w-full max-w-xs mb-3">
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">{percentage}%</span>
              <span className="text-xs text-gray-400">100%</span>
            </div>
          </div>

          {revenueNeeded > 0 && (
            <p className="text-sm text-gray-600">
              Chybí{" "}
              <span className="font-bold text-orange-600">
                {new Intl.NumberFormat("cs-CZ").format(revenueNeeded)} Kč
              </span>{" "}
              obratu do odemčení
            </p>
          )}

          <button
            className="mt-4 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
            onClick={() => {
              window.location.href = "/makler/dashboard";
            }}
          >
            Jak zvýšit obrat?
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

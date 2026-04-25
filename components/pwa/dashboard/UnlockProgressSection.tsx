"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { LevelBadge } from "@/components/pwa/gamification/LevelBadge";
import { LockedFeatureCard } from "@/components/pwa/LockedFeatureCard";
import type { Feature } from "@/lib/feature-gates";
import { getLockedFeatures, TIER_INFO } from "@/lib/feature-gates";
import type { StarLevelKey } from "@/lib/gamification-levels";

interface UnlockProgressSectionProps {
  userLevel: string;
  percentage: number;
  revenueNeeded: number;
  nextLevelKey: StarLevelKey | null;
  nextLevelName: string | null;
}

export function UnlockProgressSection({
  userLevel,
  percentage,
  revenueNeeded,
  nextLevelKey,
  nextLevelName,
}: UnlockProgressSectionProps) {
  const locked = getLockedFeatures(userLevel);
  if (locked.length === 0) return null;

  // Show first 3 locked features
  const preview = locked.slice(0, 3) as Feature[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="space-y-3"
    >
      {/* Progress card */}
      {nextLevelKey && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-gray-900">Váš postup</p>
              <p className="text-xs text-gray-500">
                Do úrovně {nextLevelName ?? TIER_INFO[nextLevelKey]?.displayName}
              </p>
            </div>
            <LevelBadge level={userLevel} size="sm" />
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{percentage}%</span>
            {revenueNeeded > 0 && (
              <span className="text-xs text-gray-500">
                Chybí{" "}
                <span className="font-semibold text-orange-600">
                  {new Intl.NumberFormat("cs-CZ").format(revenueNeeded)} Kč
                </span>
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Locked features preview */}
      <div>
        <p className="text-sm font-bold text-gray-900 mb-2">
          Odemkněte další funkce
        </p>
        <div className="space-y-2">
          {preview.map((feature) => (
            <LockedFeatureCard
              key={feature}
              feature={feature}
              compact
              percentage={percentage}
              revenueNeeded={revenueNeeded}
            />
          ))}
        </div>
        {locked.length > 3 && (
          <p className="text-xs text-gray-400 text-center mt-2">
            a dalších {locked.length - 3} funkcí k odemčen��
          </p>
        )}
      </div>
    </motion.div>
  );
}

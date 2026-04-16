"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  calculateProfileCompleteness,
  type ProfileCompletenessInput,
} from "@/lib/profile-completeness";

export interface ProfileCompletenessBarProps {
  user: ProfileCompletenessInput;
  /** URL na wizard — default `/muj-ucet/profil/setup`. */
  setupHref?: string;
  /** Skryt banner pri 100% (default true). */
  hideWhenComplete?: boolean;
  className?: string;
}

/**
 * Dashboard banner — zobrazi % vyplneni profilu + CTA na wizard.
 * Skryje se pri 100% (lze vypnout pres `hideWhenComplete={false}`).
 */
export function ProfileCompletenessBar({
  user,
  setupHref = "/muj-ucet/profil/setup",
  hideWhenComplete = true,
  className = "",
}: ProfileCompletenessBarProps) {
  const { percent, missing } = calculateProfileCompleteness(user);

  if (hideWhenComplete && percent >= 100) return null;

  const top3 = missing.slice(0, 3).map((m) => m.label);

  return (
    <Card
      className={`p-5 bg-gradient-to-r from-orange-50 to-white border-l-4 border-orange-500 ${className}`}
    >
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <h3 className="font-semibold text-gray-900">
          Profil vyplněn z {percent} %
        </h3>
        <Link
          href={setupHref}
          className="text-sm text-orange-600 font-semibold no-underline hover:text-orange-700"
        >
          Dokončit profil &rarr;
        </Link>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      {top3.length > 0 && (
        <p className="text-xs text-gray-500">
          Chybí: {top3.join(", ")}
          {missing.length > 3 && ` a ${missing.length - 3} dalších`}
        </p>
      )}
    </Card>
  );
}

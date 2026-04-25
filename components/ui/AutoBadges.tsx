"use client";

import { BADGE_CATALOG, type BadgeContext } from "@/lib/reputation/auto-badges";

interface AutoBadgesProps {
  badges: { badge: string; context: string; unlockedAt: string | Date }[];
}

export function AutoBadges({ badges }: AutoBadgesProps) {
  if (badges.length === 0) return null;

  // Look up emoji + label from catalog
  const enriched = badges.map((b) => {
    const contextBadges = BADGE_CATALOG[b.context as BadgeContext] ?? [];
    const def = contextBadges.find((cb) => cb.badge === b.badge);
    return {
      ...b,
      emoji: def?.emoji ?? "🏅",
      label: def?.label ?? b.badge,
      desc: def?.desc ?? "",
    };
  });

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {enriched.map((b) => (
        <span
          key={b.badge}
          title={b.desc}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full border border-orange-100"
        >
          <span>{b.emoji}</span>
          {b.label}
        </span>
      ))}
    </div>
  );
}

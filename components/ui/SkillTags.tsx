"use client";

import { useState, useCallback } from "react";
import { SKILL_TAGS, MIN_TAG_DISPLAY_COUNT, type SkillTagContext } from "@/lib/reputation/skill-tag-defs";

interface SkillTagsProps {
  tags: { tag: string; count: number }[];
  targetId: string;
  context: string;
  interactive?: boolean;
}

export function SkillTags({ tags, targetId, context, interactive = false }: SkillTagsProps) {
  const [localTags, setLocalTags] = useState(tags);
  const [clickedTags, setClickedTags] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const contextTags = SKILL_TAGS[context as SkillTagContext] ?? [];

  const handleClick = useCallback(
    async (tag: string) => {
      if (!interactive || clickedTags.has(tag) || busy) return;
      setBusy(true);

      try {
        const res = await fetch(`/api/reputation/${targetId}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag, context }),
        });

        if (res.ok) {
          setClickedTags((prev) => new Set(prev).add(tag));
          setLocalTags((prev) => {
            const existing = prev.find((t) => t.tag === tag);
            if (existing) {
              return prev.map((t) =>
                t.tag === tag ? { ...t, count: t.count + 1 } : t,
              );
            }
            return [...prev, { tag, count: 1 }];
          });
        }
      } catch {
        // silently fail
      } finally {
        setBusy(false);
      }
    },
    [targetId, context, interactive, clickedTags, busy],
  );

  // In interactive mode, show all context tags (even with 0 count)
  // In non-interactive mode, show only tags with count >= threshold
  const displayTags = interactive
    ? contextTags.map((ct) => {
        const found = localTags.find((t) => t.tag === ct.tag);
        return { ...ct, count: found?.count ?? 0 };
      })
    : contextTags
        .map((ct) => {
          const found = localTags.find((t) => t.tag === ct.tag);
          return { ...ct, count: found?.count ?? 0 };
        })
        .filter((t) => t.count >= MIN_TAG_DISPLAY_COUNT)
        .sort((a, b) => b.count - a.count);

  if (displayTags.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      {interactive && (
        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
          Ohodnoťte makléře
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-1.5">
        {displayTags.map((t) => {
          const clicked = clickedTags.has(t.tag);
          const hasCount = t.count > 0;
          return (
            <button
              key={t.tag}
              type="button"
              onClick={() => handleClick(t.tag)}
              disabled={!interactive || clicked || busy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${interactive && !clicked
                  ? "cursor-pointer hover:scale-105 hover:shadow-sm active:scale-95 bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                  : "cursor-default"
                }
                ${clicked
                  ? "bg-orange-50 border border-orange-300 text-orange-700 scale-105"
                  : hasCount
                    ? "bg-gray-50 border border-gray-200 text-gray-700"
                    : "bg-white border border-gray-150 text-gray-400"
                }
              `}
            >
              <span className="text-sm leading-none">{t.emoji}</span>
              <span>{t.label}</span>
              {hasCount && (
                <span className={`text-[10px] font-bold ${clicked ? "text-orange-500" : "text-gray-400"}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { SKILL_TAGS, MIN_TAG_DISPLAY_COUNT, type SkillTagContext } from "@/lib/reputation/skill-tags";

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
    <div className="flex flex-wrap justify-center gap-2">
      {displayTags.map((t) => {
        const clicked = clickedTags.has(t.tag);
        return (
          <button
            key={t.tag}
            type="button"
            onClick={() => handleClick(t.tag)}
            disabled={!interactive || clicked || busy}
            title={t.label}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all
              ${interactive && !clicked
                ? "cursor-pointer hover:scale-105 hover:shadow-sm active:scale-95 bg-white border border-gray-200 hover:border-orange-300"
                : "cursor-default bg-gray-50 border border-gray-100"
              }
              ${clicked ? "bg-orange-50 border-orange-200 scale-105" : ""}
            `}
          >
            <span className="text-base">{t.emoji}</span>
            {t.count > 0 && (
              <span className={`text-xs font-medium ${clicked ? "text-orange-600" : "text-gray-600"}`}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

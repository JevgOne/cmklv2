"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const REACTION_TYPES = [
  { type: "LIKE", emoji: "\u{1F44D}", label: "Líbí se" },
  { type: "HEART", emoji: "\u2764\uFE0F", label: "Super" },
  { type: "CLAP", emoji: "\u{1F44F}", label: "Výborné" },
  { type: "FIRE", emoji: "\u{1F525}", label: "Hot" },
  { type: "THINKING", emoji: "\u{1F914}", label: "Zajímavé" },
] as const;

interface ArticleReactionsProps {
  articleId: string;
  initialCounts: Record<string, number>;
  initialUserReactions: string[];
}

export function ArticleReactions({
  articleId,
  initialCounts,
  initialUserReactions,
}: ArticleReactionsProps) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [userReactions, setUserReactions] = useState<string[]>(initialUserReactions);
  const [animating, setAnimating] = useState<string | null>(null);

  const handleToggle = useCallback(
    async (type: string) => {
      const isActive = userReactions.includes(type);

      // Optimistic update
      setUserReactions((prev) =>
        isActive ? prev.filter((t) => t !== type) : [...prev, type]
      );
      setCounts((prev) => ({
        ...prev,
        [type]: (prev[type] || 0) + (isActive ? -1 : 1),
      }));
      setAnimating(type);
      setTimeout(() => setAnimating(null), 300);

      try {
        const res = await fetch(`/api/blog/articles/${articleId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });

        if (res.ok) {
          const data = await res.json();
          setCounts(data.counts);
        } else {
          // Revert
          setUserReactions((prev) =>
            isActive ? [...prev, type] : prev.filter((t) => t !== type)
          );
          setCounts((prev) => ({
            ...prev,
            [type]: (prev[type] || 0) + (isActive ? 1 : -1),
          }));
        }
      } catch {
        // Revert
        setUserReactions((prev) =>
          isActive ? [...prev, type] : prev.filter((t) => t !== type)
        );
        setCounts((prev) => ({
          ...prev,
          [type]: (prev[type] || 0) + (isActive ? 1 : -1),
        }));
      }
    },
    [articleId, userReactions]
  );

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-1 py-4">
      {REACTION_TYPES.map(({ type, emoji, label }) => {
        const isActive = userReactions.includes(type);
        const count = counts[type] || 0;

        return (
          <motion.button
            key={type}
            onClick={() => handleToggle(type)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors ${
              isActive
                ? "bg-orange-50 border border-orange-200 text-orange-700"
                : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
            animate={animating === type ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            title={label}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={count}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="text-xs font-medium"
                >
                  {count}
                </motion.span>
              </AnimatePresence>
            )}
          </motion.button>
        );
      })}
      {totalReactions > 0 && (
        <span className="text-xs text-gray-400 ml-2">
          {totalReactions} {totalReactions === 1 ? "reakce" : totalReactions < 5 ? "reakce" : "reakcí"}
        </span>
      )}
    </div>
  );
}

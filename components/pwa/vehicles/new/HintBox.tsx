"use client";

import { useSession } from "next-auth/react";

const HIDDEN_LEVELS = ["STAR_3", "STAR_4", "STAR_5"];

export function HintBox({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const level = (session?.user as Record<string, unknown>)?.level as string | undefined;
  if (level && HIDDEN_LEVELS.includes(level)) return null;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
      <p className="text-xs text-blue-700 leading-relaxed">{children}</p>
    </div>
  );
}

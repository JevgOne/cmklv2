"use client";

import { cn } from "@/lib/utils";

interface SeoStatusBadgeProps {
  status: string | null;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  OK: { bg: "bg-green-100", text: "text-green-700", label: "OK" },
  WARNING: { bg: "bg-amber-100", text: "text-amber-700", label: "Varování" },
  ERROR: { bg: "bg-red-100", text: "text-red-700", label: "Chyba" },
};

export function SeoStatusBadge({ status, className }: SeoStatusBadgeProps) {
  if (!status) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-500", className)}>
        Neauditováno
      </span>
    );
  }

  const config = statusConfig[status] || statusConfig.OK;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold", config.bg, config.text, className)}>
      {config.label}
    </span>
  );
}

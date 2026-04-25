"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { LevelProgressBar } from "@/components/ui/LevelProgressBar";
import { LEVEL_LABELS } from "@/lib/role-labels";

export interface BrokerBoxProps {
  name: string;
  initials: string;
  region: string;
  rating: number;
  salesCount: number;
  avgDays: number;
  phone: string;
  slug: string;
  level?: string;
  totalPoints?: number;
  className?: string;
}

export function BrokerBox({
  name,
  initials,
  region,
  rating,
  salesCount,
  avgDays,
  phone,
  slug,
  level,
  totalPoints,
  className,
}: BrokerBoxProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-card p-6 flex flex-col gap-5",
        className
      )}
    >
      {/* Avatar + info */}
      <div className="flex items-center gap-4">
        <div className="w-[60px] h-[60px] bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-[22px] font-extrabold text-white shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-bold text-gray-900">{name}</h4>
          <p className="text-sm text-orange-700 font-semibold">
            {level ? (LEVEL_LABELS[level] || "Makléř") : "Makléř"}
          </p>
          {level && typeof totalPoints === "number" && (
            <LevelProgressBar level={level} totalPoints={totalPoints} size="sm" />
          )}
        </div>
      </div>

      {/* Region */}
      <div className="text-sm text-gray-500 flex items-center gap-1.5">
        <span>📍</span> {region}
      </div>

      {/* Rating + stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-orange-400">⭐</span>
          <span className="font-bold text-gray-900">{rating}</span>
        </div>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">{salesCount} prodejů</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">{avgDays} dní &#8960;</span>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          size="default"
          className="w-full"
          onClick={() => {
            const form = document.querySelector("form");
            if (form) {
              form.scrollIntoView({ behavior: "smooth", block: "center" });
              const firstInput = form.querySelector("input");
              if (firstInput) setTimeout(() => firstInput.focus(), 500);
            }
          }}
        >
          <svg
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Napsat zprávu
        </Button>
        <a href={`tel:${phone.replace(/\s/g, '')}`} className="no-underline">
          <Button variant="outline" size="default" className="w-full text-sm sm:text-base">
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            Zavolat {phone}
          </Button>
        </a>
      </div>

      {/* Profile link */}
      <Link
        href={`/profil/${slug}`}
        className="text-sm text-orange-700 font-semibold hover:text-orange-600 transition-colors text-center no-underline"
      >
        Zobrazit profil makléře &rarr;
      </Link>
    </div>
  );
}

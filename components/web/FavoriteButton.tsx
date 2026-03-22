"use client";

import { useState } from "react";

interface FavoriteButtonProps {
  listingId?: string;
}

export function FavoriteButton({ listingId }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!listingId) return;
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
      } else if (res.status === 401) {
        // Nepřihlášený uživatel — přesměrovat na login
        window.location.href = "/login";
        return;
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`absolute top-3 right-3 w-9 h-9 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer hover:bg-white border-none ${
        favorited
          ? "bg-red-500 opacity-100"
          : "bg-white/80 opacity-0 group-hover:opacity-100"
      }`}
      aria-label={favorited ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
      onClick={handleClick}
    >
      <svg
        className={`w-5 h-5 ${favorited ? "text-white" : "text-gray-600"}`}
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}

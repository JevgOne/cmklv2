"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  vehicleId?: string;
  listingId?: string;
  partId?: string;
  initialLiked?: boolean;
  initialCount?: number;
  size?: "sm" | "md";
}

export function LikeButton({
  vehicleId,
  listingId,
  partId,
  initialLiked = false,
  initialCount = 0,
  size = "md",
}: LikeButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  const handleToggle = async () => {
    if (!session?.user) {
      router.push(`/prihlaseni?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Optimistic update
    setLiked(!liked);
    setCount((c) => (liked ? c - 1 : c + 1));
    if (!liked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, listingId, partId }),
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.totalLikes);
      } else {
        // Revert optimistic update
        setLiked(liked);
        setCount(count);
      }
    } catch {
      setLiked(liked);
      setCount(count);
    }
  };

  const sizeClasses = size === "sm"
    ? "text-sm gap-1 px-2 py-1"
    : "text-base gap-1.5 px-3 py-1.5";

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center rounded-full font-medium transition-all cursor-pointer border-none
        ${sizeClasses}
        ${liked
          ? "bg-red-50 text-red-500"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }
        ${animating ? "scale-110" : "scale-100"}
      `}
      style={{ transition: "transform 0.15s ease, background 0.2s, color 0.2s" }}
      title={liked ? "Odlajkovat" : "Lajkovat"}
    >
      <span style={{ transition: "transform 0.15s ease" }}>
        {liked ? "♥" : "♡"}
      </span>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

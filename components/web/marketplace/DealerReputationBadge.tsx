interface DealerReputationBadgeProps {
  rating: number | null | undefined;
  flipCount?: number;
  /** Kompaktní verze pro karty */
  size?: "sm" | "md";
  className?: string;
}

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const empty = max - full - (hasHalf ? 1 : 0);

  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} z ${max} hvězd`}>
      {Array.from({ length: full }, (_, i) => (
        <svg key={`f${i}`} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {hasHalf && (
        <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      {Array.from({ length: Math.max(0, empty) }, (_, i) => (
        <svg key={`e${i}`} className="w-3.5 h-3.5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export function DealerReputationBadge({
  rating,
  flipCount,
  size = "md",
  className = "",
}: DealerReputationBadgeProps) {
  if (rating === null || rating === undefined) return null;

  const isTopDealer = rating >= 4.5;

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs ${className}`}
        title={`Rating: ${rating}/5${flipCount ? ` (${flipCount} flipů)` : ""}`}
      >
        <Stars rating={rating} />
        <span className="font-semibold text-gray-500">{rating}</span>
        {flipCount !== undefined && (
          <span className="text-gray-400">({flipCount})</span>
        )}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Stars rating={rating} />
        <span className="text-sm font-bold text-gray-900">{rating}</span>
      </div>
      {flipCount !== undefined && (
        <span className="text-xs text-gray-400">{flipCount} flipů</span>
      )}
      {isTopDealer && (
        <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-yellow-200">
          Top Dealer
        </span>
      )}
    </div>
  );
}

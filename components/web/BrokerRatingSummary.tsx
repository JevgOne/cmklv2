import { RatingBreakdownBar } from "./RatingBreakdownBar";
import { DetailedRatingDisplay } from "./DetailedRatingDisplay";

interface BreakdownItem {
  stars: number;
  count: number;
  percentage: number;
}

interface DetailedRatings {
  communication: number | null;
  speed: number | null;
  fairness: number | null;
  professionalism: number | null;
}

function Stars({ rating, size = "text-2xl" }: { rating: number; size?: string }) {
  return (
    <span className={`text-orange-400 ${size}`}>
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

interface Props {
  avgRating: number;
  reviewCount: number;
  recommendRate: number;
  breakdown: BreakdownItem[];
  detailedRatings: DetailedRatings;
}

export function BrokerRatingSummary({
  avgRating,
  reviewCount,
  recommendRate,
  breakdown,
  detailedRatings,
}: Props) {
  if (reviewCount === 0) return null;

  return (
    <div className="space-y-5">
      {/* Top row: big number + breakdown */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Left — big rating */}
        <div className="flex flex-col items-center sm:items-start shrink-0">
          <span className="text-4xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
          <Stars rating={avgRating} />
          <p className="text-sm text-gray-500 mt-1">
            {reviewCount} {reviewCount === 1 ? "recenze" : reviewCount < 5 ? "recenze" : "recenzí"}
            {recommendRate > 0 && ` · ${Math.round(recommendRate)}% doporučuje`}
          </p>
        </div>

        {/* Right — breakdown bars */}
        <div className="flex-1 min-w-0">
          <RatingBreakdownBar breakdown={breakdown} />
        </div>
      </div>

      {/* Detailed ratings row */}
      <DetailedRatingDisplay ratings={detailedRatings} />
    </div>
  );
}

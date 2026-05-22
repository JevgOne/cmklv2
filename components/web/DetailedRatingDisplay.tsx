interface DetailedRatings {
  communication: number | null;
  speed: number | null;
  fairness: number | null;
  professionalism: number | null;
}

const LABELS: Record<keyof DetailedRatings, string> = {
  communication: "Komunikace",
  speed: "Rychlost",
  fairness: "Férovost",
  professionalism: "Profesionalita",
};

function MiniStars({ rating }: { rating: number }) {
  return (
    <span className="text-orange-400 text-xs">
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

interface Props {
  ratings: DetailedRatings;
}

export function DetailedRatingDisplay({ ratings }: Props) {
  const entries = (Object.keys(LABELS) as (keyof DetailedRatings)[]).filter(
    (key) => ratings[key] !== null
  );

  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {entries.map((key) => (
        <div key={key} className="text-center">
          <p className="text-xs text-gray-500 mb-0.5">{LABELS[key]}</p>
          <MiniStars rating={ratings[key]!} />
          <p className="text-sm font-bold text-gray-900">{ratings[key]!.toFixed(1)}</p>
        </div>
      ))}
    </div>
  );
}

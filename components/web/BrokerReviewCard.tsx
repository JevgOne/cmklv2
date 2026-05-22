interface BrokerReviewData {
  id: string;
  authorName: string;
  authorCity: string | null;
  rating: number;
  recommend: boolean;
  text: string;
  transactionType: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  isVerified: boolean;
  ratingCommunication: number | null;
  ratingSpeed: number | null;
  ratingFairness: number | null;
  ratingProfessionalism: number | null;
  createdAt: string;
}

const AVATAR_COLORS = [
  "bg-orange-100 text-orange-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
];

const TRANSACTION_LABELS: Record<string, { label: string; cls: string }> = {
  SALE: { label: "Prodej auta", cls: "bg-green-50 text-green-700" },
  PURCHASE: { label: "Nákup auta", cls: "bg-blue-50 text-blue-700" },
  CONSULTATION: { label: "Konzultace", cls: "bg-gray-100 text-gray-600" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="text-orange-400">
      {"★".repeat(count)}
      {"☆".repeat(5 - count)}
    </span>
  );
}

function MiniRating({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
      <span className="text-orange-400 text-xs">
        {"★".repeat(value)}
        {"☆".repeat(5 - value)}
      </span>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

interface Props {
  review: BrokerReviewData;
}

export function BrokerReviewCard({ review }: Props) {
  const initials = getInitials(review.authorName);
  const colorCls = AVATAR_COLORS[getColorIndex(review.authorName)];
  const transaction = review.transactionType
    ? TRANSACTION_LABELS[review.transactionType]
    : null;

  const hasDetailedRatings =
    review.ratingCommunication !== null ||
    review.ratingSpeed !== null ||
    review.ratingFairness !== null ||
    review.ratingProfessionalism !== null;

  return (
    <div className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colorCls}`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">
              {review.authorName}
            </span>
            {review.authorCity && (
              <span className="text-xs text-gray-500">· {review.authorCity}</span>
            )}
            <span className="text-xs text-gray-400">· {formatDate(review.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Stars count={review.rating} />
            {review.isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                Ověřený prodej
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Transaction + vehicle context */}
      {(transaction || review.vehicleBrand) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {transaction && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${transaction.cls}`}>
              {transaction.label}
            </span>
          )}
          {review.vehicleBrand && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {review.vehicleBrand}
              {review.vehicleModel ? ` ${review.vehicleModel}` : ""}
            </span>
          )}
        </div>
      )}

      {/* Review text */}
      <p className="text-sm text-gray-700 leading-relaxed mt-3">{review.text}</p>

      {/* Detailed ratings */}
      {hasDetailedRatings && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-50">
          {review.ratingCommunication !== null && (
            <MiniRating label="Komunikace" value={review.ratingCommunication} />
          )}
          {review.ratingSpeed !== null && (
            <MiniRating label="Rychlost" value={review.ratingSpeed} />
          )}
          {review.ratingFairness !== null && (
            <MiniRating label="Férovost" value={review.ratingFairness} />
          )}
          {review.ratingProfessionalism !== null && (
            <MiniRating label="Profesionalita" value={review.ratingProfessionalism} />
          )}
        </div>
      )}

      {/* Recommend */}
      {review.recommend && (
        <div className="flex items-center gap-1.5 mt-3 text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          <span className="text-xs font-medium">Doporučuje tohoto makléře</span>
        </div>
      )}
    </div>
  );
}

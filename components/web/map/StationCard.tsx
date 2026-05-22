import Link from "next/link";
import type { MapMarker } from "@/lib/map-config";

interface StationCardProps {
  station: MapMarker;
  isSelected?: boolean;
  onClick?: () => void;
}

export function StationCard({ station, isSelected, onClick }: StationCardProps) {
  const detailHref =
    station.type === "stk"
      ? `/stk/${station.slug}`
      : `/autoservisy/${station.slug}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-gray-100 transition-colors hover:bg-orange-50/50 ${
        isSelected ? "bg-orange-50 border-l-4 border-l-orange-400" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate">
            {station.name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{station.city}</div>
        </div>
        {station.rating > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-yellow-500 text-xs">★</span>
            <span className="text-xs font-bold text-gray-900">
              {station.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {station.phone && (
        <div className="text-xs text-gray-400 mt-1">{station.phone}</div>
      )}

      <div className="mt-2">
        <Link
          href={detailHref}
          className="text-xs font-semibold text-orange-500 hover:text-orange-600 no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          Detail →
        </Link>
      </div>
    </button>
  );
}

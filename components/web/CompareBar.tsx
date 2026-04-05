"use client";

import Link from "next/link";
import { useCompare } from "./CompareContext";

export function CompareBar() {
  const { vehicles, removeVehicle, clearAll } = useCompare();

  if (vehicles.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          {/* Vehicle thumbnails */}
          <div className="flex items-center gap-3 flex-1 overflow-x-auto">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 shrink-0"
              >
                <img
                  src={v.photo}
                  alt={v.name}
                  className="w-12 h-9 object-cover rounded"
                />
                <span className="text-sm font-medium text-gray-900 max-w-[120px] truncate">
                  {v.name}
                </span>
                <button
                  type="button"
                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none p-0"
                  onClick={() => removeVehicle(v.id)}
                  aria-label={`Odebrat ${v.name}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 3 - vehicles.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-[180px] h-[52px] border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-500 shrink-0"
              >
                + Přidat vůz
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer bg-transparent border-none"
              onClick={clearAll}
            >
              Zrušit
            </button>
            <Link
              href="/nabidka/porovnani"
              className={`inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer transition-all duration-200 whitespace-nowrap py-2.5 px-6 text-sm no-underline ${
                vehicles.length >= 2
                  ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange hover:-translate-y-0.5"
                  : "bg-gray-200 text-gray-400 pointer-events-none"
              }`}
            >
              Porovnat ({vehicles.length})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

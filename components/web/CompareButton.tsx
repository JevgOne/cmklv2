"use client";

import { useCompare, type CompareVehicle } from "./CompareContext";

interface CompareButtonProps {
  vehicle: CompareVehicle;
}

export function CompareButton({ vehicle }: CompareButtonProps) {
  const { addVehicle, removeVehicle, isInCompare } = useCompare();
  const active = isInCompare(vehicle.id);

  return (
    <button
      type="button"
      className={`absolute top-3 right-12 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border-none ${
        active
          ? "bg-orange-500 opacity-100"
          : "bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-white"
      }`}
      aria-label={active ? "Odebrat z porovnání" : "Přidat do porovnání"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (active) {
          removeVehicle(vehicle.id);
        } else {
          addVehicle(vehicle);
        }
      }}
    >
      <svg
        className={`w-5 h-5 ${active ? "text-white" : "text-gray-600"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
        />
      </svg>
    </button>
  );
}

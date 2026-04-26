"use client";

import { useState } from "react";

interface PhotoPositionDiagramProps {
  activeSlot: string | null;
  completedSlots: string[];
  onSlotClick?: (slotId: string) => void;
}

const POSITIONS: Array<{
  slotId: string;
  number: number;
  label: string;
  x: number;
  y: number;
}> = [
  { slotId: "ext_front_34", number: 1, label: "Přední 3/4", x: 85, y: 20 },
  { slotId: "ext_front", number: 2, label: "Přední", x: 50, y: 5 },
  { slotId: "ext_right", number: 3, label: "Pravý bok", x: 95, y: 50 },
  { slotId: "ext_rear_34", number: 4, label: "Zadní 3/4 P", x: 85, y: 80 },
  { slotId: "ext_rear", number: 5, label: "Zadní", x: 50, y: 95 },
  { slotId: "ext_left", number: 6, label: "Levý bok", x: 5, y: 50 },
  { slotId: "ext_front_34_left", number: 7, label: "Přední 3/4 L", x: 15, y: 20 },
  { slotId: "ext_rear_34_left", number: 8, label: "Zadní 3/4 L", x: 15, y: 80 },
  { slotId: "ext_headlight", number: 9, label: "Světlo", x: 75, y: 12 },
  { slotId: "ext_wheel_front", number: 10, label: "Kolo P", x: 80, y: 32 },
  { slotId: "ext_wheel_rear", number: 11, label: "Kolo Z", x: 80, y: 68 },
  { slotId: "ext_badge", number: 12, label: "Badge", x: 60, y: 88 },
  { slotId: "ext_roof", number: 13, label: "Střecha", x: 30, y: 40 },
];

export function PhotoPositionDiagram({
  activeSlot,
  completedSlots,
  onSlotClick,
}: PhotoPositionDiagramProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const hoveredPos = hoveredSlot
    ? POSITIONS.find((p) => p.slotId === hoveredSlot)
    : null;

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <div className="relative aspect-[4/5]">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Auto silueta — top-down obrys */}
          <rect
            x="30" y="18" width="40" height="64" rx="12" ry="12"
            className="fill-gray-100 stroke-gray-300" strokeWidth="1"
          />
          {/* Přední okno */}
          <rect x="35" y="25" width="30" height="10" rx="4" className="fill-gray-200" />
          {/* Zadní okno */}
          <rect x="35" y="65" width="30" height="8" rx="4" className="fill-gray-200" />
          {/* Kola */}
          <rect x="27" y="28" width="5" height="10" rx="2" className="fill-gray-400" />
          <rect x="68" y="28" width="5" height="10" rx="2" className="fill-gray-400" />
          <rect x="27" y="62" width="5" height="10" rx="2" className="fill-gray-400" />
          <rect x="68" y="62" width="5" height="10" rx="2" className="fill-gray-400" />

          {/* Pozice bodů */}
          {POSITIONS.map((pos) => {
            const isActive = activeSlot === pos.slotId;
            const isCompleted = completedSlots.includes(pos.slotId);
            const isHovered = hoveredSlot === pos.slotId;
            const fillColor = isActive
              ? "#F97316"
              : isCompleted
                ? "#22C55E"
                : "#D1D5DB";
            const textColor = isActive || isCompleted ? "white" : "#6B7280";

            return (
              <g
                key={pos.slotId}
                className="cursor-pointer"
                onClick={() => onSlotClick?.(pos.slotId)}
                onMouseEnter={() => setHoveredSlot(pos.slotId)}
                onMouseLeave={() => setHoveredSlot(null)}
                onTouchStart={() => setHoveredSlot(pos.slotId)}
              >
                <circle
                  cx={pos.x} cy={pos.y} r={isHovered ? 5.5 : 4.5}
                  fill={fillColor}
                  stroke={isActive || isHovered ? "#EA580C" : "transparent"}
                  strokeWidth="1"
                  className="transition-all duration-150"
                />
                <text
                  x={pos.x} y={pos.y + 1.5}
                  textAnchor="middle" fontSize="4" fontWeight="bold"
                  fill={textColor}
                >
                  {pos.number}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredPos && (
          <div
            className="absolute pointer-events-none bg-gray-900 text-white text-[11px] font-medium px-2 py-1 rounded-md whitespace-nowrap z-10 -translate-x-1/2"
            style={{
              left: `${hoveredPos.x}%`,
              top: `${Math.max(hoveredPos.y - 8, 0)}%`,
            }}
          >
            {hoveredPos.number}. {hoveredPos.label}
          </div>
        )}
      </div>

      {/* Status legenda */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
          Aktuální
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
          Hotovo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
          Chybí
        </span>
      </div>

      {/* Popisky pozic */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
        {POSITIONS.map((pos) => {
          const isCompleted = completedSlots.includes(pos.slotId);
          const isActive = activeSlot === pos.slotId;
          return (
            <button
              key={pos.slotId}
              type="button"
              onClick={() => onSlotClick?.(pos.slotId)}
              className={`flex items-center gap-1.5 text-left text-[11px] py-0.5 rounded transition-colors ${
                isActive
                  ? "text-orange-600 font-semibold"
                  : isCompleted
                    ? "text-green-600"
                    : "text-gray-400"
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                isActive
                  ? "bg-orange-500 text-white"
                  : isCompleted
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}>
                {isCompleted ? "\u2713" : pos.number}
              </span>
              {pos.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

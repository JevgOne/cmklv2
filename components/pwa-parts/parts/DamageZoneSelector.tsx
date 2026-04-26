"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  DAMAGE_ZONES,
  ZONE_LABELS,
  DAMAGE_LEVEL_LABELS,
  DAMAGE_LEVEL_COLORS,
  getAutoPresets,
  getDefaultDamageZones,
  getAirbagsWarning,
  type DamageZone,
  type DamageLevel,
} from "@/lib/damage-zones";

interface DamageZoneSelectorProps {
  disposalType: string;
  damageZones: Record<DamageZone, DamageLevel>;
  onChange: (zones: Record<DamageZone, DamageLevel>) => void;
  onNext: () => void;
  onBack: () => void;
}

const LEVEL_OPTIONS: { value: DamageLevel; label: string }[] = [
  { value: "ok", label: "Nepoškozeno" },
  { value: "light", label: "Lehké" },
  { value: "heavy", label: "Těžké" },
  { value: "destroyed", label: "Zničeno" },
];

// SVG car zones — simplified top-down view
const BODY_ZONES: { zone: DamageZone; path: string; label: string }[] = [
  {
    zone: "FRONT",
    path: "M60,20 L140,20 Q155,20 155,35 L155,55 L45,55 L45,35 Q45,20 60,20 Z",
    label: "Přední",
  },
  {
    zone: "REAR",
    path: "M45,185 L155,185 L155,205 Q155,220 140,220 L60,220 Q45,220 45,205 Z",
    label: "Zadní",
  },
  {
    zone: "LEFT",
    path: "M25,55 L45,55 L45,185 L25,185 Q15,185 15,175 L15,65 Q15,55 25,55 Z",
    label: "Levý",
  },
  {
    zone: "RIGHT",
    path: "M155,55 L175,55 Q185,55 185,65 L185,175 Q185,185 175,185 L155,185 Z",
    label: "Pravý",
  },
  {
    zone: "ROOF",
    path: "M55,70 L145,70 L145,170 L55,170 Z",
    label: "Střecha",
  },
];

const NON_BODY_ZONES: DamageZone[] = ["UNDERBODY", "ENGINE_BAY", "INTERIOR"];

export function DamageZoneSelector({
  disposalType,
  damageZones,
  onChange,
  onNext,
  onBack,
}: DamageZoneSelectorProps) {
  // Apply presets on mount
  useEffect(() => {
    const presets = getAutoPresets(disposalType);
    if (Object.keys(presets).length > 0) {
      const defaults = getDefaultDamageZones();
      onChange({ ...defaults, ...presets });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showAirbagsWarning = getAirbagsWarning(disposalType);

  const handleZoneChange = (zone: DamageZone, level: DamageLevel) => {
    onChange({ ...damageZones, [zone]: level });
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Mapa poškození</h2>
        <span className="text-sm text-gray-500">Krok 3 / 8</span>
      </div>

      {showAirbagsWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-sm text-amber-800">
          <strong>Upozornění:</strong> U nehody mohou být airbagy odpálené —
          nelze je prodat.
        </div>
      )}

      {/* SVG car diagram */}
      <div className="flex justify-center mb-6">
        <svg viewBox="0 0 200 240" className="w-56 h-auto">
          {BODY_ZONES.map(({ zone, path, label }) => (
            <g key={zone} className="cursor-pointer">
              <path
                d={path}
                fill={DAMAGE_LEVEL_COLORS[damageZones[zone] ?? "ok"]}
                fillOpacity={0.4}
                stroke={DAMAGE_LEVEL_COLORS[damageZones[zone] ?? "ok"]}
                strokeWidth={2}
                className="transition-colors"
              />
              <text
                x={zone === "LEFT" ? 30 : zone === "RIGHT" ? 170 : 100}
                y={
                  zone === "FRONT"
                    ? 42
                    : zone === "REAR"
                      ? 205
                      : zone === "LEFT"
                        ? 120
                        : zone === "RIGHT"
                          ? 120
                          : 120
                }
                textAnchor="middle"
                className="text-[10px] font-bold fill-gray-700 pointer-events-none select-none"
              >
                {label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Zone dropdowns */}
      <div className="space-y-3">
        {DAMAGE_ZONES.map((zone) => (
          <div
            key={zone}
            className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    DAMAGE_LEVEL_COLORS[damageZones[zone] ?? "ok"],
                }}
              />
              <span className="text-sm font-medium text-gray-900 truncate">
                {ZONE_LABELS[zone]}
              </span>
            </div>
            <select
              value={damageZones[zone] ?? "ok"}
              onChange={(e) =>
                handleZoneChange(zone, e.target.value as DamageLevel)
              }
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
        {LEVEL_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: DAMAGE_LEVEL_COLORS[opt.value] }}
            />
            <span>{opt.label}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Zpět
        </button>
        <Button variant="primary" size="sm" onClick={onNext}>
          Pokračovat
        </Button>
      </div>
    </div>
  );
}

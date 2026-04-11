"use client";

import { useState, useCallback } from "react";

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"] as const;

interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

interface OpeningHoursEditorProps {
  value: string | null;
  onChange: (json: string) => void;
}

export function OpeningHoursEditor({ value, onChange }: OpeningHoursEditorProps) {
  const [hours, setHours] = useState<Record<string, DaySchedule>>(() => parseHours(value));

  const handleChange = useCallback((day: string, field: keyof DaySchedule, val: string | boolean) => {
    setHours(prev => {
      const updated = { ...prev, [day]: { ...prev[day], [field]: val } };
      onChange(serializeHours(updated));
      return updated;
    });
  }, [onChange]);

  const copyToWeekdays = useCallback(() => {
    const monday = hours["Pondělí"];
    setHours(prev => {
      const updated = { ...prev };
      for (const day of ["Úterý", "Středa", "Čtvrtek", "Pátek"]) {
        updated[day] = { ...monday };
      }
      onChange(serializeHours(updated));
      return updated;
    });
  }, [hours, onChange]);

  return (
    <div className="space-y-3">
      {DAYS.map(day => (
        <div key={day} className="flex items-center gap-3">
          <span className="w-20 text-sm font-medium text-gray-700 shrink-0">{day}</span>
          <label className="flex items-center gap-2 shrink-0">
            <input
              type="checkbox"
              checked={!hours[day].closed}
              onChange={e => handleChange(day, "closed", !e.target.checked)}
              className="accent-orange-500 w-4 h-4"
            />
            <span className="text-xs text-gray-500">{hours[day].closed ? "Zavřeno" : "Otevřeno"}</span>
          </label>
          {!hours[day].closed && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={hours[day].open}
                onChange={e => handleChange(day, "open", e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              />
              <span className="text-gray-400">—</span>
              <input
                type="time"
                value={hours[day].close}
                onChange={e => handleChange(day, "close", e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
              />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={copyToWeekdays}
        className="text-xs text-orange-500 hover:text-orange-600 font-medium mt-1"
      >
        Kopírovat pondělí na Út–Pá
      </button>
    </div>
  );
}

function parseHours(json: string | null): Record<string, DaySchedule> {
  const defaults: Record<string, DaySchedule> = {};
  for (const day of DAYS) {
    const isWeekend = day === "Sobota" || day === "Neděle";
    defaults[day] = { open: "08:00", close: "17:00", closed: isWeekend };
  }

  if (!json) return defaults;

  try {
    const parsed = JSON.parse(json) as Record<string, string>;
    for (const day of DAYS) {
      const val = parsed[day];
      if (!val || val === "Zavřeno") {
        defaults[day] = { open: "08:00", close: "17:00", closed: true };
      } else {
        const parts = val.split(/\s*[-–—]\s*/);
        defaults[day] = {
          open: parts[0]?.trim() || "08:00",
          close: parts[1]?.trim() || "17:00",
          closed: false,
        };
      }
    }
  } catch {
    // If JSON parse fails, return defaults
  }
  return defaults;
}

function serializeHours(hours: Record<string, DaySchedule>): string {
  const result: Record<string, string> = {};
  for (const day of DAYS) {
    const h = hours[day];
    result[day] = h.closed ? "Zavřeno" : `${h.open} - ${h.close}`;
  }
  return JSON.stringify(result);
}

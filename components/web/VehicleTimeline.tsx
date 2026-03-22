"use client";

import { useEffect, useState } from "react";

interface TimelineEvent {
  type: string;
  date: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
}

const iconMap: Record<string, string> = {
  circle: "\uD83D\uDFE2",
  search: "\uD83D\uDD0D",
  check: "\u2705",
  eye: "\uD83D\uDC41",
  price: "\uD83D\uDCB0",
  refresh: "\u26A0\uFE0F",
};

const colorMap: Record<string, string> = {
  green: "border-green-500 bg-green-50",
  blue: "border-blue-500 bg-blue-50",
  orange: "border-orange-500 bg-orange-50",
  purple: "border-purple-500 bg-purple-50",
  gray: "border-gray-400 bg-gray-50",
};

export function VehicleTimeline({ vehicleId }: { vehicleId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vehicles/${vehicleId}/timeline`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.timeline || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6">
        Historie na Carmakler
      </h3>

      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />

        <div className="flex flex-col gap-6">
          {events.map((event, i) => {
            const colorClass = colorMap[event.color] || colorMap.gray;
            const icon = iconMap[event.icon] || "\u2022";
            const date = new Date(event.date);
            const formattedDate = date.toLocaleDateString("cs-CZ", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            return (
              <div key={i} className="relative">
                {/* Icon dot */}
                <div
                  className={`absolute -left-8 top-0 w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center text-sm ${colorClass}`}
                >
                  {icon}
                </div>

                {/* Content */}
                <div className="pt-0.5">
                  <div className="text-xs font-semibold text-gray-400 mb-0.5">
                    {formattedDate}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {event.title}
                  </div>
                  {event.description && (
                    <div className="text-sm text-gray-500 mt-0.5">
                      {event.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

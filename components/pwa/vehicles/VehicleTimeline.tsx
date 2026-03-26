"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface TimelineEvent {
  type: "created" | "inspection" | "published" | "interest" | "price_change" | "update";
  date: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
}

interface VehicleTimelineProps {
  vehicleId: string;
}

const typeIcons: Record<string, string> = {
  created: "\uD83D\uDFE2",
  inspection: "\uD83D\uDD0D",
  published: "\u2705",
  interest: "\uD83D\uDC41",
  price_change: "\uD83D\uDCB0",
  update: "\u26A0\uFE0F",
};

const colorClasses: Record<string, string> = {
  green: "bg-green-500",
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  gray: "bg-gray-400",
};

export function VehicleTimeline({ vehicleId }: VehicleTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const res = await fetch(`/api/vehicles/${vehicleId}/timeline`);
        if (res.ok) {
          const json = await res.json();
          setEvents(json.timeline || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [vehicleId]);

  if (loading || events.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">Historie na Carmakler</h3>
      <Card className="p-4">
        <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
          {events.map((event, index) => (
            <div key={index} className="relative">
              <div
                className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 border-white ${
                  colorClasses[event.color] || "bg-gray-400"
                }`}
              />
              <div className="flex items-start gap-2">
                <span className="text-sm leading-none mt-0.5">
                  {typeIcons[event.type] || "\u26A0\uFE0F"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {event.title}
                  </p>
                  {event.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {event.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(event.date).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

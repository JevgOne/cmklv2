"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";

interface PreferenceItem {
  eventType: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

interface EventConfig {
  key: string;
  label: string;
  description: string;
}

const EVENTS: EventConfig[] = [
  {
    key: "NEW_LEAD",
    label: "Novy lead",
    description: "Kdyz vam je prirazen novy lead",
  },
  {
    key: "NEW_INQUIRY",
    label: "Novy dotaz",
    description: "Kdyz se nekdo zepta na vase vozidlo",
  },
  {
    key: "VEHICLE_APPROVED",
    label: "Inzerat schvalen",
    description: "Kdyz je vas inzerat schvalen a zverejnen",
  },
  {
    key: "VEHICLE_REJECTED",
    label: "Inzerat zamitnut",
    description: "Kdyz je vas inzerat vracen k dopracovani",
  },
  {
    key: "VEHICLE_SOLD",
    label: "Auto prodano",
    description: "Kdyz se vase vozidlo proda",
  },
  {
    key: "DAILY_SUMMARY",
    label: "Denni shrnuti",
    description: "Ranní prehled vasich statistik",
  },
  {
    key: "VEHICLE_30_DAYS",
    label: "Auto 30 dnu",
    description: "Upozorneni kdyz je auto v nabidce vice nez 30 dni",
  },
  {
    key: "ACHIEVEMENT",
    label: "Achievementy",
    description: "Odemknuti noveho achievementu",
  },
  {
    key: "LEADERBOARD",
    label: "Zebricek",
    description: "Zmeny ve vasem umisteni v zebricku",
  },
];

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<PreferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/notifications")
      .then((res) => res.json())
      .then((data) => {
        setPreferences(data.preferences ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const savePreferences = useCallback(
    async (updated: PreferenceItem[]) => {
      setSaving(true);
      try {
        await fetch("/api/settings/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: updated }),
        });
      } catch (error) {
        console.error("Chyba pri ukladani:", error);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleToggle = (
    eventType: string,
    channel: "pushEnabled" | "emailEnabled",
    value: boolean
  ) => {
    const updated = preferences.map((p) =>
      p.eventType === eventType ? { ...p, [channel]: value } : p
    );
    setPreferences(updated);
    savePreferences(updated);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  const prefMap = new Map(preferences.map((p) => [p.eventType, p]));

  return (
    <div className="space-y-4">
      {/* Hlavicka */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Udalost
          </span>
          <div className="flex gap-6">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-12 text-center">
              Push
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-12 text-center">
              Email
            </span>
          </div>
        </div>
      </Card>

      {/* Jednotlive udalosti */}
      {EVENTS.map((event) => {
        const pref = prefMap.get(event.key) ?? {
          eventType: event.key,
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
        };

        return (
          <Card key={event.key} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  {event.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {event.description}
                </div>
              </div>
              <div className="flex gap-6 shrink-0">
                <div className="w-12 flex justify-center">
                  <Toggle
                    checked={pref.pushEnabled}
                    onChange={(v) =>
                      handleToggle(event.key, "pushEnabled", v)
                    }
                    disabled={saving}
                  />
                </div>
                <div className="w-12 flex justify-center">
                  <Toggle
                    checked={pref.emailEnabled}
                    onChange={(v) =>
                      handleToggle(event.key, "emailEnabled", v)
                    }
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {saving && (
        <p className="text-xs text-gray-400 text-center">Ukladam...</p>
      )}
    </div>
  );
}

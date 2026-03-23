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
    label: "Nový lead",
    description: "Když Vám je přiřazen nový lead",
  },
  {
    key: "NEW_INQUIRY",
    label: "Nový dotaz",
    description: "Když se někdo zeptá na Vaše vozidlo",
  },
  {
    key: "VEHICLE_APPROVED",
    label: "Inzerát schválen",
    description: "Když je Váš inzerát schválen a zveřejněn",
  },
  {
    key: "VEHICLE_REJECTED",
    label: "Inzerát zamítnut",
    description: "Když je Váš inzerát vrácen k dopracování",
  },
  {
    key: "VEHICLE_SOLD",
    label: "Auto prodáno",
    description: "Když se Vaše vozidlo prodá",
  },
  {
    key: "DAILY_SUMMARY",
    label: "Denní shrnutí",
    description: "Ranní přehled Vašich statistik",
  },
  {
    key: "VEHICLE_30_DAYS",
    label: "Auto 30 dnů",
    description: "Upozornění když je auto v nabídce více než 30 dní",
  },
  {
    key: "ACHIEVEMENT",
    label: "Achievementy",
    description: "Odemknutí nového achievementu",
  },
  {
    key: "LEADERBOARD",
    label: "Žebříček",
    description: "Změny ve Vašem umístění v žebříčku",
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
        console.error("Chyba při ukládání:", error);
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
      {/* Hlavička */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Událost
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

      {/* Jednotlivé události */}
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
        <p className="text-xs text-gray-400 text-center">Ukládám...</p>
      )}
    </div>
  );
}

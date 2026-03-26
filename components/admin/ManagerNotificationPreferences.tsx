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

const MANAGER_EVENTS: EventConfig[] = [
  {
    key: "ONBOARDING_COMPLETED",
    label: "Onboarding dokoncen",
    description: "Kdyz novy makler dokonci onboarding",
  },
  {
    key: "LISTING_PENDING",
    label: "Novy inzerat ke schvaleni",
    description: "Kdyz makler zada novy inzerat ke schvaleni",
  },
  {
    key: "BROKER_REJECTED_VEHICLE",
    label: "Makler zamitnul vozidlo",
    description: "Kdyz makler odmitne nabirane vozidlo",
  },
  {
    key: "VEHICLE_60_DAYS",
    label: "Vozidlo 60 dni",
    description: "Kdyz je vozidlo v nabidce vice nez 60 dni",
  },
  {
    key: "WEEKLY_REPORT",
    label: "Tydenni report",
    description: "Tydenni prehled vykonnosti tymu",
  },
];

export function ManagerNotificationPreferences() {
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

    // Pokud event jeste neexistuje v preferences, pridat ho
    if (!preferences.find((p) => p.eventType === eventType)) {
      updated.push({
        eventType,
        pushEnabled: channel === "pushEnabled" ? value : true,
        emailEnabled: channel === "emailEnabled" ? value : true,
        smsEnabled: false,
      });
    }

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
      {MANAGER_EVENTS.map((event) => {
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

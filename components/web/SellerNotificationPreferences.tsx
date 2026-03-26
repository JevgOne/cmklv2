"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";

interface SellerPreferenceItem {
  eventType: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
}

interface EventConfig {
  key: string;
  label: string;
  description: string;
  hasSms: boolean;
}

const SELLER_EVENTS: EventConfig[] = [
  {
    key: "VEHICLE_APPROVED",
    label: "Vozidlo schvaleno",
    description: "Kdyz je Vase vozidlo schvaleno a zverejneno",
    hasSms: true,
  },
  {
    key: "NEW_INQUIRY",
    label: "Novy dotaz",
    description: "Kdyz se nekdo zepta na Vase vozidlo",
    hasSms: true,
  },
  {
    key: "VIEWING_SCHEDULED",
    label: "Prohlidka domluvena",
    description: "Kdyz je domluvena prohlidka Vaseho vozidla",
    hasSms: true,
  },
  {
    key: "VEHICLE_SOLD",
    label: "Auto prodano",
    description: "Kdyz se Vase vozidlo proda",
    hasSms: true,
  },
  {
    key: "PRICE_REDUCTION",
    label: "Doporuceni snizeni ceny",
    description: "Kdyz makler doporuci snizit cenu",
    hasSms: true,
  },
];

interface SellerNotificationPreferencesProps {
  token: string;
  sellerName: string;
  initialPreferences: SellerPreferenceItem[];
}

export function SellerNotificationPreferences({
  token,
  sellerName,
  initialPreferences,
}: SellerNotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<SellerPreferenceItem[]>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const savePreferences = useCallback(
    async (updated: SellerPreferenceItem[]) => {
      setSaving(true);
      setSavedMessage(false);
      try {
        const res = await fetch(`/api/seller-notifications/${token}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: updated }),
        });
        if (res.ok) {
          setSavedMessage(true);
          setTimeout(() => setSavedMessage(false), 2000);
        }
      } catch (error) {
        console.error("Chyba pri ukladani:", error);
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  const handleToggle = (
    eventType: string,
    channel: "smsEnabled" | "emailEnabled",
    value: boolean
  ) => {
    const updated = preferences.map((p) =>
      p.eventType === eventType ? { ...p, [channel]: value } : p
    );
    setPreferences(updated);
    savePreferences(updated);
  };

  const prefMap = new Map(preferences.map((p) => [p.eventType, p]));

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Nastaveni notifikaci
        </h1>
        <p className="text-gray-500 mt-1">
          {sellerName}, zde muzete upravit, jak Vas budeme informovat.
        </p>
      </div>

      {/* Hlavicka */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Udalost
          </span>
          <div className="flex gap-6">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-12 text-center">
              Email
            </span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-12 text-center">
              SMS
            </span>
          </div>
        </div>
      </Card>

      {/* Jednotlive udalosti */}
      {SELLER_EVENTS.map((event) => {
        const pref = prefMap.get(event.key) ?? {
          eventType: event.key,
          smsEnabled: true,
          emailEnabled: true,
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
                    checked={pref.emailEnabled}
                    onChange={(v) =>
                      handleToggle(event.key, "emailEnabled", v)
                    }
                    disabled={saving}
                  />
                </div>
                <div className="w-12 flex justify-center">
                  {event.hasSms ? (
                    <Toggle
                      checked={pref.smsEnabled}
                      onChange={(v) =>
                        handleToggle(event.key, "smsEnabled", v)
                      }
                      disabled={saving}
                    />
                  ) : (
                    <span className="text-xs text-gray-300">&mdash;</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {saving && (
        <p className="text-xs text-gray-400 text-center">Ukladam...</p>
      )}
      {savedMessage && (
        <p className="text-xs text-green-600 text-center">Ulozeno</p>
      )}
    </div>
  );
}

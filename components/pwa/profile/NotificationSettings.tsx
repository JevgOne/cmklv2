"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
}

const SETTINGS: NotificationSetting[] = [
  {
    key: "vehicleApproved",
    label: "Schvaleni vozidla",
    description: "Notifikace kdyz je vas inzerat schvalen",
  },
  {
    key: "newInquiry",
    label: "Nove dotazy",
    description: "Notifikace o novych dotazech na vase vozy",
  },
  {
    key: "commissionPaid",
    label: "Vyplata provize",
    description: "Notifikace o vyplaceni provize",
  },
  {
    key: "systemUpdates",
    label: "Systemove zpravy",
    description: "Dulezite aktualizace a novinky",
  },
];

export function NotificationSettings() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    vehicleApproved: true,
    newInquiry: true,
    commissionPaid: true,
    systemUpdates: false,
  });

  const handleChange = async (key: string, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    try {
      await fetch("/api/broker/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch {
      // Revert on failure
      setSettings(settings);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
        Nastaveni notifikaci
      </h3>
      <div className="space-y-4">
        {SETTINGS.map((setting) => (
          <div key={setting.key} className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {setting.label}
              </div>
              <div className="text-xs text-gray-500">{setting.description}</div>
            </div>
            <Toggle
              checked={settings[setting.key]}
              onChange={(value) => handleChange(setting.key, value)}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

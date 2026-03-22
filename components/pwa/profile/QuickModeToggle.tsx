"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { Alert } from "@/components/ui/Alert";

interface QuickModeToggleProps {
  initialEnabled: boolean;
}

export function QuickModeToggle({ initialEnabled }: QuickModeToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setSaving(true);
    setError(null);

    const newValue = !enabled;

    try {
      const res = await fetch("/api/profile/quick-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quickModeEnabled: newValue }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Chyba při ukládání");
        return;
      }

      setEnabled(newValue);
    } catch {
      setError("Nepodařilo se uložit nastavení");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
        Rychlé nabírání
      </h3>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            Rychlý režim nabírání
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Zkrácený 3-krokový flow pro rychlé nabírání aut v terénu.
            Na doplnění údajů máte 48 hodin.
          </p>
        </div>
        <Toggle
          checked={enabled}
          onChange={handleToggle}
          disabled={saving}
        />
      </div>

      {error && (
        <Alert variant="error" className="mt-3">
          <span className="text-sm">{error}</span>
        </Alert>
      )}
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { OpeningHoursEditor } from "@/components/partner/OpeningHoursEditor";

interface ProfileData {
  description: string;
  phone: string;
  email: string;
  web: string;
  address: string;
  openingHours: string | null;
}

export function PartnerProfileEditor({ initialData, isBazar }: { initialData: ProfileData; isBazar: boolean }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: initialData.description,
    phone: initialData.phone,
    email: initialData.email,
    web: initialData.web,
    address: initialData.address,
    openingHours: initialData.openingHours,
  });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/partner/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        console.error("Failed to save profile");
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
        Profil {isBazar ? "autobazaru" : "vrakoviste"}
      </h1>

      <Card className="p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Verejny profil
        </h3>
        <div className="space-y-4">
          <Textarea
            label="Popis firmy"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Popiste vasi firmu, specializaci, historii..."
            rows={4}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefon"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
            <Input
              label="Email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
          <Input
            label="Web"
            value={form.web}
            onChange={(e) => setForm((p) => ({ ...p, web: e.target.value }))}
          />
          <Input
            label="Adresa"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          />
          <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>
            {saving ? "Ukladam..." : "Ulozit profil"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Otevírací doba
        </h3>
        <OpeningHoursEditor
          value={form.openingHours}
          onChange={(json) => setForm(p => ({ ...p, openingHours: json }))}
        />
      </Card>
    </div>
  );
}

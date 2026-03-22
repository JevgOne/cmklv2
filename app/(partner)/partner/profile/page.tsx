"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function PartnerProfilePage() {
  const { data: session } = useSession();
  const [partner, setPartner] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    description: "",
    phone: "",
    email: "",
    web: "",
    address: "",
  });

  useEffect(() => {
    async function load() {
      try {
        // We'll use the dashboard endpoint to get partner info
        const res = await fetch("/api/partner/dashboard");
        if (res.ok) {
          const data = await res.json();
          setPartner(data);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="bg-white rounded-2xl p-6 shadow-sm h-96" />
      </div>
    );
  }

  const isBazar = session?.user?.role === "PARTNER_BAZAR";

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
          <Button variant="primary" size="sm" disabled={saving}>
            {saving ? "Ukladam..." : "Ulozit profil"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Oteviraci doba
        </h3>
        <p className="text-sm text-gray-500">
          Editor oteviraci doby bude brzy k dispozici.
        </p>
      </Card>
    </div>
  );
}

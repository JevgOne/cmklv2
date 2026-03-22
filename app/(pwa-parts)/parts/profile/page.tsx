"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export default function SupplierProfilePage() {
  const { data: session } = useSession();
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
        const res = await fetch("/api/partner/profile");
        if (res.ok) {
          const data = await res.json();
          setForm({
            description: data.description || "",
            phone: data.phone || "",
            email: data.email || "",
            web: data.web || "",
            address: data.address || "",
          });
        }
      } catch {
        // Zustane prazdne
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/partner/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch {
      // Tiché selhání
    } finally {
      setSaving(false);
    }
  }

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-extrabold text-gray-900">Profil</h1>

      {/* User info */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-xl">
            🔧
          </div>
          <div>
            <div className="font-bold text-gray-900">
              {session?.user?.firstName} {session?.user?.lastName}
            </div>
            <div className="text-xs text-gray-500">Dodavatel dilu</div>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card className="p-4 space-y-3">
        <h3 className="font-bold text-gray-900 text-sm">Verejny profil</h3>

        <Textarea
          label="Popis"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Popiste vasi firmu..."
          rows={3}
        />
        <Input
          label="Telefon"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
        <Input
          label="Email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <Input
          label="Web"
          value={form.web}
          onChange={(e) => update("web", e.target.value)}
        />
        <Input
          label="Adresa"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
        />

        <Button
          variant="primary"
          size="sm"
          className="w-full bg-gradient-to-br from-green-500 to-green-600"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Ukladam..." : "Ulozit profil"}
        </Button>
      </Card>

      {/* Logout */}
      <Card className="p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-sm text-red-500 font-semibold cursor-pointer bg-transparent border-none w-full text-center"
        >
          Odhlasit se
        </button>
      </Card>
    </div>
  );
}

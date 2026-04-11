"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PhotoUpload } from "@/components/partner/PhotoUpload";

const categoryOptions = [
  { value: "ENGINE", label: "Motor" },
  { value: "TRANSMISSION", label: "Prevodovka" },
  { value: "BRAKES", label: "Brzdy" },
  { value: "SUSPENSION", label: "Podvozek" },
  { value: "BODY", label: "Karoserie" },
  { value: "ELECTRICAL", label: "Elektro" },
  { value: "INTERIOR", label: "Interior" },
  { value: "WHEELS", label: "Kola" },
  { value: "EXHAUST", label: "Vyfuk" },
  { value: "COOLING", label: "Chlazeni" },
  { value: "FUEL", label: "Palivovy system" },
  { value: "OTHER", label: "Ostatni" },
];

const conditionOptions = [
  { value: "USED_GOOD", label: "Pouzity — velmi dobry" },
  { value: "USED_FAIR", label: "Pouzity — dobry" },
  { value: "USED_POOR", label: "Pouzity — uspokojívy" },
  { value: "REFURBISHED", label: "Repasovany" },
];

export default function NewPartPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    condition: "USED_GOOD",
    price: "",
    quantity: "1",
    description: "",
    oemNumber: "",
    brand: "",
    model: "",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/partner/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category || "OTHER",
          condition: form.condition,
          price: parseInt(form.price) || 0,
          quantity: parseInt(form.quantity) || 1,
          description: form.description || undefined,
          oemNumber: form.oemNumber || undefined,
          brand: form.brand || undefined,
          model: form.model || undefined,
          images: photos.map((url, i) => ({ url, order: i, isPrimary: i === 0 })),
        }),
      });

      if (res.ok) {
        router.push("/partner/parts");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nepodařilo se přidat díl. Zkuste to znovu.");
      }
    } catch {
      setError("Došlo k chybě. Zkuste to znovu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
        Pridat dil
      </h1>

      <Card className="p-6">
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <PhotoUpload photos={photos} onChange={setPhotos} max={10} preset="parts" />

          <Input
            label="Nazev dilu *"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="napr. Predni naraznik"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Kategorie *"
              placeholder="Vyberte kategorii"
              options={categoryOptions}
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            />
            <Select
              label="Stav"
              options={conditionOptions}
              value={form.condition}
              onChange={(e) => update("condition", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cena (Kc) *"
              type="number"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="4500"
            />
            <Input
              label="Pocet kusu"
              type="number"
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Znacka vozu"
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
              placeholder="napr. Skoda"
            />
            <Input
              label="Model vozu"
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
              placeholder="napr. Octavia"
            />
          </div>

          <Input
            label="OEM cislo"
            value={form.oemNumber}
            onChange={(e) => update("oemNumber", e.target.value)}
            placeholder="napr. 1K0 805 903"
          />

          <Textarea
            label="Popis dilu"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Popiste stav dilu, pripadne vady..."
            rows={4}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => router.push("/partner/parts")}>
              Zrusit
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting || !form.name || !form.price}
            >
              {submitting ? "Ukladam..." : "Pridat dil"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

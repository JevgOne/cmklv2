"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

const brandOptions = [
  { value: "Škoda", label: "Škoda" },
  { value: "Volkswagen", label: "Volkswagen" },
  { value: "BMW", label: "BMW" },
  { value: "Audi", label: "Audi" },
  { value: "Mercedes-Benz", label: "Mercedes-Benz" },
  { value: "Hyundai", label: "Hyundai" },
  { value: "Toyota", label: "Toyota" },
  { value: "Ford", label: "Ford" },
  { value: "Kia", label: "Kia" },
  { value: "Peugeot", label: "Peugeot" },
  { value: "Renault", label: "Renault" },
  { value: "Opel", label: "Opel" },
];

const fuelOptions = [
  { value: "BENZIN", label: "Benzin" },
  { value: "DIESEL", label: "Diesel" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ELEKTRO", label: "Elektro" },
  { value: "LPG", label: "LPG" },
  { value: "CNG", label: "CNG" },
];

const transmissionOptions = [
  { value: "MANUAL", label: "Manualni" },
  { value: "AUTOMATIC", label: "Automaticka" },
];

export default function NewVehiclePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    mileage: "",
    price: "",
    fuel: "",
    transmission: "",
    power: "",
    description: "",
    vin: "",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/partner/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: form.brand,
          model: form.model,
          year: parseInt(form.year) || new Date().getFullYear(),
          mileage: parseInt(form.mileage) || 0,
          price: parseInt(form.price) || 0,
          fuelType: form.fuel || "BENZIN",
          transmission: form.transmission || "MANUAL",
          enginePower: parseInt(form.power) || undefined,
          description: form.description || undefined,
          vin: form.vin || undefined,
        }),
      });

      if (res.ok) {
        router.push("/partner/vehicles");
      } else {
        router.push("/partner/vehicles");
      }
    } catch {
      router.push("/partner/vehicles");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
        Pridat vozidlo
      </h1>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Znacka *"
              placeholder="Vyberte znacku"
              options={brandOptions}
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
            />
            <Input
              label="Model *"
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
              placeholder="napr. Octavia"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Rok vyroby *"
              type="number"
              value={form.year}
              onChange={(e) => update("year", e.target.value)}
              placeholder="2020"
            />
            <Input
              label="Najeto (km) *"
              type="number"
              value={form.mileage}
              onChange={(e) => update("mileage", e.target.value)}
              placeholder="120000"
            />
            <Input
              label="Cena (Kc) *"
              type="number"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="350000"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Palivo"
              options={fuelOptions}
              value={form.fuel}
              onChange={(e) => update("fuel", e.target.value)}
            />
            <Select
              label="Prevodovka"
              options={transmissionOptions}
              value={form.transmission}
              onChange={(e) => update("transmission", e.target.value)}
            />
            <Input
              label="Vykon (kW)"
              type="number"
              value={form.power}
              onChange={(e) => update("power", e.target.value)}
              placeholder="110"
            />
          </div>

          <Input
            label="VIN"
            value={form.vin}
            onChange={(e) => update("vin", e.target.value)}
            placeholder="17-ti mistny VIN kod"
          />

          <Textarea
            label="Popis vozidla"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Popiste stav vozidla, vybavu, historii..."
            rows={4}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => router.push("/partner/vehicles")}>
              Zrusit
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting || !form.brand || !form.model || !form.price}
            >
              {submitting ? "Ukladam..." : "Pridat vozidlo"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

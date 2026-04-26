"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

const fuelTypes = [
  { value: "PETROL", label: "Benzín" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Elektro" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "PLUGIN_HYBRID", label: "Plug-in Hybrid" },
  { value: "LPG", label: "LPG" },
  { value: "CNG", label: "CNG" },
];

const transmissions = [
  { value: "MANUAL", label: "Manuální" },
  { value: "AUTOMATIC", label: "Automatická" },
  { value: "DSG", label: "DSG" },
  { value: "CVT", label: "CVT" },
];

const bodyTypes = [
  { value: "SEDAN", label: "Sedan" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "COMBI", label: "Kombi" },
  { value: "SUV", label: "SUV" },
  { value: "COUPE", label: "Coupé" },
  { value: "CABRIO", label: "Kabriolet" },
  { value: "VAN", label: "Van" },
  { value: "PICKUP", label: "Pickup" },
];

const conditions = [
  { value: "NEW", label: "Nové" },
  { value: "LIKE_NEW", label: "Jako nové" },
  { value: "EXCELLENT", label: "Výborný" },
  { value: "GOOD", label: "Dobrý" },
  { value: "FAIR", label: "Uspokojivý" },
  { value: "DAMAGED", label: "Poškozené" },
];

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function AdminNewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vinLoading, setVinLoading] = useState(false);

  const [form, setForm] = useState({
    vin: "",
    brand: "",
    model: "",
    variant: "",
    year: new Date().getFullYear(),
    mileage: 0,
    fuelType: "PETROL",
    transmission: "MANUAL",
    bodyType: "SEDAN",
    condition: "GOOD",
    price: 0,
    enginePower: "",
    engineCapacity: "",
    color: "",
    description: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    city: "Praha",
  });

  function setField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleVinDecode() {
    if (form.vin.length !== 17) return;
    setVinLoading(true);
    try {
      const res = await fetch(`/api/vin/decode?vin=${form.vin}`);
      if (res.ok) {
        const { data } = await res.json();
        if (data.brand) setField("brand", data.brand);
        if (data.model) setField("model", data.model);
        if (data.year) setField("year", data.year);
        if (data.fuelType) setField("fuelType", data.fuelType);
        if (data.transmission) setField("transmission", data.transmission);
        if (data.bodyType) setField("bodyType", data.bodyType);
        if (data.enginePower) setField("enginePower", String(data.enginePower));
        if (data.engineCapacity) setField("engineCapacity", String(data.engineCapacity));
      }
    } catch {
      // VIN decode selhal — uživatel vyplní ručně
    } finally {
      setVinLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          enginePower: form.enginePower ? parseInt(form.enginePower, 10) : null,
          engineCapacity: form.engineCapacity ? parseInt(form.engineCapacity, 10) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nepodařilo se vytvořit vozidlo");
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(`/admin/vehicles/${data.vehicle.id}`);
    } catch {
      setError("Chyba spojení se serverem");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-sm text-gray-500 mb-1">Admin / Vozidla / Nové</p>
        <h1 className="text-2xl font-bold text-gray-900">Přidat vozidlo</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VIN */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">VIN</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={form.vin}
                onChange={(e) => setField("vin", e.target.value.toUpperCase())}
                placeholder="Např. WVWZZZ3CZWE123456"
                maxLength={17}
                required
                className={inputClass + " font-mono tracking-wider"}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleVinDecode}
              disabled={form.vin.length !== 17 || vinLoading}
            >
              {vinLoading ? "Dekóduji..." : "Dekódovat VIN"}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            17 znaků. Po dekódování se automaticky vyplní údaje o vozidle.
          </p>
        </Card>

        {/* Základní údaje */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Základní údaje</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Značka *</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setField("brand", e.target.value)}
                placeholder="Např. Škoda"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Model *</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setField("model", e.target.value)}
                placeholder="Např. Octavia"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Varianta</label>
              <input
                type="text"
                value={form.variant}
                onChange={(e) => setField("variant", e.target.value)}
                placeholder="Např. RS"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Rok výroby *</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setField("year", parseInt(e.target.value, 10))}
                min={1990}
                max={new Date().getFullYear() + 1}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nájezd (km) *</label>
              <input
                type="number"
                value={form.mileage || ""}
                onChange={(e) => setField("mileage", parseInt(e.target.value, 10) || 0)}
                placeholder="Např. 85000"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Barva</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
                placeholder="Např. Černá metalíza"
                className={inputClass}
              />
            </div>
          </div>
        </Card>

        {/* Motor a karoserie */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Motor a karoserie</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Palivo *</label>
              <select
                value={form.fuelType}
                onChange={(e) => setField("fuelType", e.target.value)}
                className={inputClass}
              >
                {fuelTypes.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Převodovka *</label>
              <select
                value={form.transmission}
                onChange={(e) => setField("transmission", e.target.value)}
                className={inputClass}
              >
                {transmissions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Karoserie</label>
              <select
                value={form.bodyType}
                onChange={(e) => setField("bodyType", e.target.value)}
                className={inputClass}
              >
                {bodyTypes.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Výkon (kW)</label>
              <input
                type="number"
                value={form.enginePower}
                onChange={(e) => setField("enginePower", e.target.value)}
                placeholder="Např. 110"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Objem (ccm)</label>
              <input
                type="number"
                value={form.engineCapacity}
                onChange={(e) => setField("engineCapacity", e.target.value)}
                placeholder="Např. 1968"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Stav *</label>
              <select
                value={form.condition}
                onChange={(e) => setField("condition", e.target.value)}
                className={inputClass}
              >
                {conditions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Cena */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Cena</h2>
          <div className="max-w-xs">
            <label className={labelClass}>Cena (Kč) *</label>
            <input
              type="number"
              value={form.price || ""}
              onChange={(e) => setField("price", parseInt(e.target.value, 10) || 0)}
              placeholder="Např. 350000"
              required
              className={inputClass}
            />
          </div>
        </Card>

        {/* Kontakt */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Kontakt na prodejce</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Jméno</label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => setField("contactName", e.target.value)}
                placeholder="Jan Novák"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Telefon</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setField("contactPhone", e.target.value)}
                placeholder="+420 777 123 456"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setField("contactEmail", e.target.value)}
                placeholder="jan@email.cz"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Město *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="Praha"
                required
                className={inputClass}
              />
            </div>
          </div>
        </Card>

        {/* Popis */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Popis</h2>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={4}
            placeholder="Volitelný popis vozidla..."
            className={inputClass + " resize-y"}
          />
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Vytvářím..." : "Vytvořit vozidlo"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/vehicles")}
          >
            Zrušit
          </Button>
        </div>
      </form>
    </div>
  );
}

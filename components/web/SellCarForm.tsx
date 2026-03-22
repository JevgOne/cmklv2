"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";

const carBrands = [
  { value: "skoda", label: "Škoda" },
  { value: "volkswagen", label: "Volkswagen" },
  { value: "bmw", label: "BMW" },
  { value: "audi", label: "Audi" },
  { value: "mercedes", label: "Mercedes-Benz" },
  { value: "hyundai", label: "Hyundai" },
  { value: "toyota", label: "Toyota" },
  { value: "ford", label: "Ford" },
  { value: "kia", label: "Kia" },
  { value: "peugeot", label: "Peugeot" },
  { value: "renault", label: "Renault" },
  { value: "opel", label: "Opel" },
  { value: "seat", label: "SEAT" },
  { value: "volvo", label: "Volvo" },
  { value: "mazda", label: "Mazda" },
  { value: "honda", label: "Honda" },
  { value: "citroen", label: "Citroën" },
  { value: "fiat", label: "Fiat" },
  { value: "dacia", label: "Dacia" },
  { value: "nissan", label: "Nissan" },
];

const fuelOptions = [
  { value: "benzin", label: "Benzín" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "elektro", label: "Elektro" },
  { value: "lpg", label: "LPG" },
  { value: "cng", label: "CNG" },
];

const yearOptions = Array.from({ length: 27 }, (_, i) => {
  const year = 2026 - i;
  return { value: String(year), label: String(year) };
});

export function SellCarForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/sell-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          model,
          year,
          mileage,
          fuelType,
          name,
          phone,
          email,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se odeslat požadavek");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nepodařilo se odeslat požadavek"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-5 sm:p-8 md:p-10">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">
        Zadejte údaje o vozidle
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Vyplňte formulář a makléř se vám ozve do 30 minut
      </p>

      {submitted ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Děkujeme za váš zájem!
          </h3>
          <p className="text-gray-600">
            Náš makléř se vám ozve do 30 minut.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Značka"
              placeholder="Vyberte značku"
              options={carBrands}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
            <Input
              label="Model"
              placeholder="např. Octavia, Golf, 3 Series..."
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Select
              label="Rok výroby"
              placeholder="Vyberte rok"
              options={yearOptions}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
            <Input
              label="Najeto km"
              type="number"
              placeholder="např. 85000"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              required
            />
            <Select
              label="Palivo"
              placeholder="Vyberte palivo"
              options={fuelOptions}
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              required
            />
          </div>

          <div className="h-px bg-gray-200 my-2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Vaše jméno"
              placeholder="Jan Novák"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Telefon"
              type="tel"
              placeholder="+420 777 123 456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="jan@email.cz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Textarea
            label="Poznámka"
            placeholder="Cokoliv dalšího nám chcete sdělit (nepovinné)..."
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <Button
            variant="primary"
            size="lg"
            className="w-full mt-2"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Odesílám..." : "Chci prodat auto"}
          </Button>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2 text-[14px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="text-success-500 font-bold">✓</span>
              Ozveme se do 30 minut
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-success-500 font-bold">✓</span>
              Žádné závazky, je to nezávazné
            </span>
          </div>
        </form>
      )}
    </Card>
  );
}

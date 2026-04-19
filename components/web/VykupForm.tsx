"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function VykupForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Výkup vozidla",
          phone,
          message: `[Výkup vozidla] ${brand} ${model}, rok ${year}, nájezd ${mileage} km`,
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
        Chci nabídku výkupu
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Vyplňte údaje o vozidle a ozveme se vám do 30 minut
      </p>

      {submitted ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Děkujeme za váš zájem!
          </h3>
          <p className="text-gray-600">
            Nabídku výkupu obdržíte do 30 minut.
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
            <Input
              label="Značka"
              placeholder="např. Škoda"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
            <Input
              label="Model"
              placeholder="např. Octavia"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Rok výroby"
              type="number"
              placeholder="např. 2019"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={1990}
              max={new Date().getFullYear()}
              required
            />
            <Input
              label="Nájezd (km)"
              type="number"
              placeholder="např. 85000"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              required
            />
          </div>

          <Input
            label="Telefon"
            type="tel"
            placeholder="+420 777 123 456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Button variant="primary" size="lg" className="w-full" type="submit" disabled={submitting}>
            {submitting ? "Odesílám..." : "Získat nabídku"}
          </Button>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-1 text-[14px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="text-success-500 font-bold">✓</span>
              Peníze do 24 hodin
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-success-500 font-bold">✓</span>
              Bez skrytých poplatků
            </span>
          </div>
        </form>
      )}
    </Card>
  );
}

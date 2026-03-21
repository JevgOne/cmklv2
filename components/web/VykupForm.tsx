"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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

const yearOptions = Array.from({ length: 27 }, (_, i) => {
  const year = 2026 - i;
  return { value: String(year), label: String(year) };
});

export function VykupForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Card className="p-5 sm:p-8 md:p-10">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">
        Chci nabídku na výkup
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Vyplňte údaje a nabídneme vám férovou cenu
      </p>

      {submitted ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Děkujeme za váš zájem!
          </h3>
          <p className="text-gray-600">
            Nabídku na výkup obdržíte do 24 hodin.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Značka"
              placeholder="Vyberte značku"
              options={carBrands}
            />
            <Input
              label="Model"
              placeholder="např. Octavia, Golf..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Rok výroby"
              placeholder="Vyberte rok"
              options={yearOptions}
            />
            <Input
              label="Najeto km"
              type="number"
              placeholder="např. 85000"
            />
          </div>

          <Input
            label="Telefon"
            type="tel"
            placeholder="+420 777 123 456"
          />

          <Button variant="primary" size="lg" className="w-full" type="submit">
            Chci nabídku na výkup
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

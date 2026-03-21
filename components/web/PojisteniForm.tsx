"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function PojisteniForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Card className="p-5 sm:p-8 md:p-10">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">
        Chci nabídku pojištění
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Vyplňte údaje a my vám najdeme nejlepší nabídku
      </p>

      {submitted ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Děkujeme za váš zájem!
          </h3>
          <p className="text-gray-600">
            Nabídku pojištění obdržíte do 30 minut.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="SPZ vozidla"
            placeholder="např. 1AB 2345"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Vaše jméno"
              placeholder="Jan Novák"
            />
            <Input
              label="Telefon"
              type="tel"
              placeholder="+420 777 123 456"
            />
          </div>

          <Button variant="primary" size="lg" className="w-full" type="submit">
            Chci nabídku pojištění
          </Button>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-1 text-[14px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="text-success-500 font-bold">✓</span>
              Srovnání všech pojišťoven
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-success-500 font-bold">✓</span>
              Bez poplatků
            </span>
          </div>
        </form>
      )}
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function FinancovaniCalc() {
  const [price, setPrice] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const numericPrice = Number(price.replace(/\s/g, "")) || 0;
  const monthlyPayment = numericPrice > 0 ? Math.round(numericPrice / 48) : 0;

  const formatNumber = (n: number) =>
    n.toLocaleString("cs-CZ");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <Card className="p-5 sm:p-8 md:p-10">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">
        Kalkulačka splátek
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Spočítejte si orientační měsíční splátku
      </p>

      {submitted ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Děkujeme za váš zájem!
          </h3>
          <p className="text-gray-600">
            Náš specialista se vám ozve do 30 minut.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Cena vozidla (Kč)"
            type="number"
            placeholder="např. 450000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          {monthlyPayment > 0 && (
            <div className="bg-orange-50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">
                Orientační měsíční splátka (48 měsíců)
              </p>
              <p className="text-3xl font-extrabold text-orange-500">
                ~{formatNumber(monthlyPayment)} Kč
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Úrok od 3,9 % p.a. Kalkulace je orientační.
              </p>
            </div>
          )}

          <Button variant="primary" size="lg" className="w-full" type="submit">
            Chci financování
          </Button>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-1 text-[14px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="text-success-500 font-bold">✓</span>
              Schválení do 30 minut
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-success-500 font-bold">✓</span>
              Bez zálohy
            </span>
          </div>
        </form>
      )}
    </Card>
  );
}

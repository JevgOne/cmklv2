"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function FinancovaniCalc() {
  const [price, setPrice] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericPrice = Number(price.replace(/\s/g, "")) || 0;
  const monthlyPayment = numericPrice > 0 ? Math.round(numericPrice / 48) : 0;

  const formatNumber = (n: number) =>
    n.toLocaleString("cs-CZ");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Žádost o financování",
          phone,
          message: `[Financování] Cena vozidla: ${price} Kč, orientační splátka: ${formatNumber(monthlyPayment)} Kč/měs.`,
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
    <Card className="p-5 sm:p-8 md:p-10 shadow-lg">
      <div className="text-4xl text-center mb-3">🧮</div>
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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            label="Cena vozidla (Kč)"
            type="number"
            placeholder="např. 450000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          {monthlyPayment > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">
                Orientační měsíční splátka (48 měsíců)
              </p>
              <p className="text-3xl font-extrabold text-orange-500">
                ~{formatNumber(monthlyPayment)} Kč
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Úrok od 3,9 % p.a. Kalkulace je orientační.
              </p>
            </div>
          )}

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

          <Button variant="primary" size="lg" className="w-full" type="submit" disabled={submitting}>
            {submitting ? "Odesílám..." : "Chci financování"}
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

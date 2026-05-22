"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const LOW_RATE = 3.9;
const HIGH_RATE = 6.9;
const DURATION_OPTIONS = [12, 24, 36, 48, 60, 72, 84];

function calcMonthlyPayment(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.round(principal / months);
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

function formatPrice(n: number): string {
  return n.toLocaleString("cs-CZ");
}

export function FinancovaniCalc() {
  const [price, setPrice] = useState("");
  const [downPayment, setDownPayment] = useState(20);
  const [months, setMonths] = useState(60);

  // Contact form
  const [showContact, setShowContact] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calc = useMemo(() => {
    const vehiclePrice = parseInt(price.replace(/\s/g, "")) || 0;
    if (vehiclePrice <= 0) return null;

    const downPaymentAmount = Math.round(vehiclePrice * downPayment / 100);
    const loanAmount = vehiclePrice - downPaymentAmount;
    if (loanAmount <= 0) return null;

    const lowPayment = calcMonthlyPayment(loanAmount, LOW_RATE, months);
    const highPayment = calcMonthlyPayment(loanAmount, HIGH_RATE, months);
    const lowTotal = lowPayment * months;
    const highTotal = highPayment * months;

    return {
      vehiclePrice,
      downPaymentAmount,
      loanAmount,
      lowPayment,
      highPayment,
      lowTotal,
      highTotal,
      lowOverpay: lowTotal - loanAmount,
      highOverpay: highTotal - loanAmount,
      lowOverpayPct: ((lowTotal - loanAmount) / loanAmount * 100).toFixed(1),
      highOverpayPct: ((highTotal - loanAmount) / loanAmount * 100).toFixed(1),
    };
  }, [price, downPayment, months]);

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          message: `[Financování kalkulačka] Cena vozu: ${price} Kč, Akontace: ${downPayment}%, Doba: ${months} měs., Splátka: ${calc ? `${formatPrice(calc.lowPayment)}–${formatPrice(calc.highPayment)} Kč/měs.` : "neúplný výpočet"}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se odeslat");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se odeslat");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 sm:p-8 md:p-10 shadow-lg">
      <div className="text-4xl text-center mb-3">🧮</div>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">
        Kalkulačka splátek
      </h2>
      <p className="text-gray-500 text-center mb-6">
        Spočítejte si orientační měsíční splátku za pár sekund
      </p>

      <div className="space-y-5">
        {/* Vehicle price */}
        <Input
          label="Cena vozidla (Kč)"
          type="text"
          inputMode="numeric"
          placeholder="např. 450 000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        {/* Down payment slider */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Akontace: {downPayment}%
            {calc && (
              <span className="font-normal normal-case text-gray-400 ml-2">
                ({formatPrice(calc.downPaymentAmount)} Kč)
              </span>
            )}
          </label>
          <input
            type="range"
            min={0}
            max={80}
            step={5}
            value={downPayment}
            onChange={(e) => setDownPayment(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>80%</span>
          </div>
        </div>

        {/* Duration buttons */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Doba splácení
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DURATION_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`px-2 py-2.5 text-sm font-medium rounded-lg border-2 transition ${
                  months === m
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {m} m.
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result */}
      {calc && (
        <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
          {/* Main payment */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 mb-1">Orientační měsíční splátka</p>
            <p className="text-3xl font-extrabold text-orange-600">
              {formatPrice(calc.lowPayment)} – {formatPrice(calc.highPayment)} Kč
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Úrok {LOW_RATE}% – {HIGH_RATE}% p.a. (dle schválení)
            </p>
          </div>

          <div className="border-t border-orange-200 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Cena vozidla</span>
              <span className="font-medium text-gray-900">{formatPrice(calc.vehiclePrice)} Kč</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Akontace ({downPayment}%)</span>
              <span className="font-medium text-gray-900">{formatPrice(calc.downPaymentAmount)} Kč</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Výše úvěru</span>
              <span className="font-medium text-gray-900">{formatPrice(calc.loanAmount)} Kč</span>
            </div>
            <div className="border-t border-orange-200 my-1.5" />
            <div className="flex justify-between">
              <span className="text-gray-600">Celkem zaplatíte</span>
              <span className="font-medium text-gray-900">
                {formatPrice(calc.lowTotal)} – {formatPrice(calc.highTotal)} Kč
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Přeplacení</span>
              <span className="font-medium text-gray-900">
                {formatPrice(calc.lowOverpay)} – {formatPrice(calc.highOverpay)} Kč ({calc.lowOverpayPct}–{calc.highOverpayPct}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer — STOP-2 */}
      {calc && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Orientační výpočet. Skutečné podmínky financování závisí na schválení žádosti a individuálním posouzení.
        </p>
      )}

      {/* CTA */}
      {calc && !showContact && !submitted && (
        <Button
          variant="primary"
          size="lg"
          className="w-full mt-5"
          onClick={() => setShowContact(true)}
        >
          Chci financování
        </Button>
      )}

      {/* Contact form */}
      {showContact && !submitted && (
        <form onSubmit={handleContactSubmit} className="mt-5 pt-5 border-t border-gray-200 space-y-4">
          <h3 className="font-bold text-gray-900">Nezávazná poptávka</h3>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {submitting ? "Odesílám..." : "Odeslat poptávku"}
          </Button>
        </form>
      )}

      {/* Success */}
      {submitted && (
        <div className="mt-5 text-center py-8">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Děkujeme za váš zájem!
          </h3>
          <p className="text-gray-600">
            Náš specialista se vám ozve do 30 minut.
          </p>
        </div>
      )}

      {/* Trust badges */}
      {!submitted && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-5 text-[14px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="text-success-500 font-bold">✓</span>
            Schválení do 30 minut
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-success-500 font-bold">✓</span>
            Bez zálohy
          </span>
        </div>
      )}
    </Card>
  );
}

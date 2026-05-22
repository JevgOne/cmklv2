"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type InsuranceType = "povinne" | "havarijni" | "obe";
type EngineSize = "do-1400" | "1400-2000" | "2000-3000" | "3000+";
type VehicleAge = "0-3" | "4-7" | "8-15" | "15+";

const POVINNE_BASE: Record<EngineSize, [number, number]> = {
  "do-1400":   [1800, 3600],
  "1400-2000": [2400, 4800],
  "2000-3000": [3600, 7200],
  "3000+":     [5400, 10800],
};

const HAVARIJNI_RATE: Record<VehicleAge, [number, number]> = {
  "0-3":  [1.5, 3.0],
  "4-7":  [2.0, 4.0],
  "8-15": [2.5, 5.0],
  "15+":  [3.0, 6.0],
};

const ENGINE_OPTIONS: { value: EngineSize; label: string }[] = [
  { value: "do-1400", label: "do 1 400 ccm" },
  { value: "1400-2000", label: "1 400 – 2 000 ccm" },
  { value: "2000-3000", label: "2 000 – 3 000 ccm" },
  { value: "3000+", label: "3 000+ ccm" },
];

const AGE_OPTIONS: { value: VehicleAge; label: string }[] = [
  { value: "0-3", label: "Nové (0–3 roky)" },
  { value: "4-7", label: "4–7 let" },
  { value: "8-15", label: "8–15 let" },
  { value: "15+", label: "15+ let" },
];

function formatPrice(n: number): string {
  return n.toLocaleString("cs-CZ");
}

export function PojisteniCalc() {
  const [type, setType] = useState<InsuranceType>("obe");
  const [engine, setEngine] = useState<EngineSize>("1400-2000");
  const [age, setAge] = useState<VehicleAge>("4-7");
  const [vehiclePrice, setVehiclePrice] = useState("");

  // Contact form
  const [showContact, setShowContact] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [spz, setSpz] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calc = useMemo(() => {
    const showPovinne = type === "povinne" || type === "obe";
    const showHavarijni = type === "havarijni" || type === "obe";
    const price = parseInt(vehiclePrice.replace(/\s/g, "")) || 0;

    const povinne = showPovinne ? POVINNE_BASE[engine] : null;

    let havarijni: [number, number] | null = null;
    if (showHavarijni && price > 0) {
      const rates = HAVARIJNI_RATE[age];
      havarijni = [
        Math.round(price * rates[0] / 100),
        Math.round(price * rates[1] / 100),
      ];
    }

    const totalMin = (povinne?.[0] ?? 0) + (havarijni?.[0] ?? 0);
    const totalMax = (povinne?.[1] ?? 0) + (havarijni?.[1] ?? 0);
    const hasResult = totalMin > 0;

    return { povinne, havarijni, totalMin, totalMax, hasResult, showHavarijni, needsPrice: showHavarijni && price <= 0 };
  }, [type, engine, age, vehiclePrice]);

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
          message: `[Pojištění kalkulačka] SPZ: ${spz}, Typ: ${type}, Motor: ${engine}, Stáří: ${age}, Cena vozu: ${vehiclePrice || "neuvedeno"}, Odhad: ${calc.hasResult ? `${formatPrice(calc.totalMin)}–${formatPrice(calc.totalMax)} Kč/rok` : "neúplný"}`,
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
        Kalkulačka pojištění
      </h2>
      <p className="text-gray-500 text-center mb-6">
        Spočítejte si orientační cenu pojištění za pár sekund
      </p>

      {/* Calculator inputs */}
      <div className="space-y-5">
        {/* Insurance type */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Typ pojištění
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "povinne", label: "Povinné ručení" },
              { value: "havarijni", label: "Havarijní" },
              { value: "obe", label: "Obojí" },
            ] as { value: InsuranceType; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`px-3 py-2.5 text-sm font-medium rounded-lg border-2 transition ${
                  type === opt.value
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Engine size */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Objem motoru
          </label>
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value as EngineSize)}
            className="w-full px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg focus:border-orange-500 focus:bg-white transition cursor-pointer"
          >
            {ENGINE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Vehicle age */}
        <div>
          <label className="block text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Stáří vozu
          </label>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value as VehicleAge)}
            className="w-full px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 border-2 border-transparent rounded-lg focus:border-orange-500 focus:bg-white transition cursor-pointer"
          >
            {AGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Vehicle price (for havarijni) */}
        {calc.showHavarijni && (
          <Input
            label="Cena vozu (Kč)"
            type="text"
            inputMode="numeric"
            placeholder="např. 450 000"
            value={vehiclePrice}
            onChange={(e) => setVehiclePrice(e.target.value)}
          />
        )}
      </div>

      {/* Result */}
      {calc.hasResult && (
        <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Orientační roční pojistné
          </h3>

          {calc.povinne && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Povinné ručení</span>
              <span className="font-bold text-gray-900">
                {formatPrice(calc.povinne[0])} – {formatPrice(calc.povinne[1])} Kč/rok
              </span>
            </div>
          )}

          {calc.havarijni && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Havarijní pojištění</span>
              <span className="font-bold text-gray-900">
                {formatPrice(calc.havarijni[0])} – {formatPrice(calc.havarijni[1])} Kč/rok
              </span>
            </div>
          )}

          {calc.povinne && calc.havarijni && (
            <>
              <div className="border-t border-orange-200 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Celkem</span>
                <span className="font-extrabold text-lg text-orange-600">
                  {formatPrice(calc.totalMin)} – {formatPrice(calc.totalMax)} Kč/rok
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Needs price warning */}
      {calc.needsPrice && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
          Pro výpočet havarijního pojištění zadejte cenu vozu.
        </div>
      )}

      {/* Disclaimer — STOP-4 */}
      {calc.hasResult && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Orientační výpočet. Skutečné pojistné závisí na bezeškodném průběhu, regionu a dalších individuálních faktorech.
        </p>
      )}

      {/* CTA button */}
      {calc.hasResult && !showContact && !submitted && (
        <Button
          variant="primary"
          size="lg"
          className="w-full mt-5"
          onClick={() => setShowContact(true)}
        >
          Chci přesnou nabídku
        </Button>
      )}

      {/* Contact form — STOP-3 */}
      {showContact && !submitted && (
        <form onSubmit={handleContactSubmit} className="mt-5 pt-5 border-t border-gray-200 space-y-4">
          <h3 className="font-bold text-gray-900">Chci přesnou nabídku</h3>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          <Input
            label="SPZ vozidla"
            placeholder="např. 1AB 2345"
            value={spz}
            onChange={(e) => setSpz(e.target.value)}
            required
          />
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
            Přesnou nabídku pojištění obdržíte do 30 minut.
          </p>
        </div>
      )}

      {/* Trust badges */}
      {!submitted && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-5 text-[14px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="text-success-500 font-bold">✓</span>
            Srovnání všech pojišťoven
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-success-500 font-bold">✓</span>
            Bez poplatků
          </span>
        </div>
      )}
    </Card>
  );
}

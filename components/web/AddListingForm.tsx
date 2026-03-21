"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Select options                                                      */
/* ------------------------------------------------------------------ */

const znacky = [
  "Audi", "BMW", "Citroën", "Dacia", "Fiat", "Ford", "Honda", "Hyundai",
  "Kia", "Mazda", "Mercedes-Benz", "Nissan", "Opel", "Peugeot", "Renault",
  "Seat", "Škoda", "Toyota", "Volkswagen", "Volvo",
];

const paliva = ["Benzín", "Diesel", "Hybrid", "Elektro", "LPG", "CNG"];

const prevodovky = ["Manuální", "Automatická"];

const mesta = [
  "Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc",
  "České Budějovice", "Hradec Králové", "Pardubice", "Zlín", "Jiné",
];

const roky = Array.from({ length: 27 }, (_, i) => 2026 - i);

/* ------------------------------------------------------------------ */
/*  Form data type                                                      */
/* ------------------------------------------------------------------ */

interface FormData {
  znacka: string;
  model: string;
  rok: string;
  km: string;
  palivo: string;
  prevodovka: string;
  cena: string;
  cenaDohodou: boolean;
  popis: string;
  jmeno: string;
  telefon: string;
  email: string;
  mesto: string;
}

const initialFormData: FormData = {
  znacka: "",
  model: "",
  rok: "",
  km: "",
  palivo: "",
  prevodovka: "",
  cena: "",
  cenaDohodou: false,
  popis: "",
  jmeno: "",
  telefon: "",
  email: "",
  mesto: "",
};

/* ------------------------------------------------------------------ */
/*  Shared field classes                                                */
/* ------------------------------------------------------------------ */

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[15px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all";

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function AddListingForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/inzerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: formData.znacka,
          model: formData.model,
          year: Number(formData.rok),
          mileage: Number(formData.km),
          fuelType: formData.palivo,
          transmission: formData.prevodovka,
          price: Number(formData.cena),
          priceNegotiable: formData.cenaDohodou,
          description: formData.popis || undefined,
          contactName: formData.jmeno,
          contactPhone: formData.telefon,
          contactEmail: formData.email || undefined,
          city: formData.mesto,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se vytvořit inzerát");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nepodařilo se vytvořit inzerát"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setStep(1);
    setSubmitted(false);
    setError(null);
  };

  const stepLabels = ["Auto", "Fotky", "Kontakt"];

  /* ================================================================ */
  /*  Success state                                                     */
  /* ================================================================ */
  if (submitted) {
    return (
      <Card className="p-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-[40px] mx-auto">
          &#10003;
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mt-6">
          Váš inzerát je online!
        </h2>
        <p className="text-gray-500 mt-3 max-w-md mx-auto">
          Právě jsme publikovali váš inzerát. Kupující ho uvidí během pár minut.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link href="/inzerce/katalog" className="no-underline">
            <Button variant="outline">
              Zobrazit můj inzerát
            </Button>
          </Link>
          <Button variant="primary" onClick={resetForm}>
            Vložit další
          </Button>
        </div>
      </Card>
    );
  }

  /* ================================================================ */
  /*  Step indicator                                                    */
  /* ================================================================ */
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {stepLabels.map((label, index) => {
        const stepNum = index + 1;
        const isActive = step === stepNum;
        const isCompleted = step > stepNum;
        return (
          <div key={label} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={cn(
                  "w-8 md:w-12 h-0.5",
                  isCompleted ? "bg-orange-500" : "bg-gray-200"
                )}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  isActive
                    ? "bg-orange-500 text-white"
                    : isCompleted
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-400"
                )}
              >
                {isCompleted ? "✓" : stepNum}
              </div>
              <span
                className={cn(
                  "text-sm font-medium hidden sm:inline",
                  isActive ? "text-gray-900" : "text-gray-400"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ================================================================ */
  /*  Step 1: Auto                                                      */
  /* ================================================================ */
  const Step1 = () => (
    <Card className="p-6 md:p-8">
      <h2 className="text-lg font-bold text-gray-900 mb-6">
        Údaje o voze
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Značka */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Značka
          </label>
          <select
            className={inputClass}
            value={formData.znacka}
            onChange={(e) => updateField("znacka", e.target.value)}
            required
          >
            <option value="">Vyberte značku</option>
            {znacky.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Model
          </label>
          <input
            type="text"
            placeholder="Např. Octavia, Fabia..."
            className={inputClass}
            value={formData.model}
            onChange={(e) => updateField("model", e.target.value)}
            required
          />
        </div>

        {/* Rok výroby */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Rok výroby
          </label>
          <select
            className={inputClass}
            value={formData.rok}
            onChange={(e) => updateField("rok", e.target.value)}
            required
          >
            <option value="">Rok výroby</option>
            {roky.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Najeto km */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Najeto km
          </label>
          <input
            type="number"
            placeholder="Např. 45000"
            className={inputClass}
            min={0}
            value={formData.km}
            onChange={(e) => updateField("km", e.target.value)}
            required
          />
        </div>

        {/* Palivo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Palivo
          </label>
          <select
            className={inputClass}
            value={formData.palivo}
            onChange={(e) => updateField("palivo", e.target.value)}
            required
          >
            <option value="">Typ paliva</option>
            {paliva.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Převodovka */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Převodovka
          </label>
          <select
            className={inputClass}
            value={formData.prevodovka}
            onChange={(e) => updateField("prevodovka", e.target.value)}
            required
          >
            <option value="">Typ převodovky</option>
            {prevodovky.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Cena Kč */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Cena Kč
          </label>
          <input
            type="number"
            placeholder="Např. 350000"
            className={inputClass}
            min={0}
            value={formData.cena}
            onChange={(e) => updateField("cena", e.target.value)}
            required={!formData.cenaDohodou}
          />
        </div>

        {/* Cena dohodou checkbox */}
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              checked={formData.cenaDohodou}
              onChange={(e) => updateField("cenaDohodou", e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">
              Cena dohodou
            </span>
          </label>
        </div>
      </div>

      {/* Popis */}
      <div className="mt-4">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Popis{" "}
          <span className="font-normal text-gray-400">(volitelné)</span>
        </label>
        <textarea
          className={cn(inputClass, "min-h-[100px] resize-y")}
          placeholder="Popište stav vozu, výbavu, historii..."
          value={formData.popis}
          onChange={(e) => updateField("popis", e.target.value)}
        />
      </div>

      {/* Next */}
      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
          onClick={() => setStep(2)}
        >
          Pokračovat &rarr;
        </Button>
      </div>
    </Card>
  );

  /* ================================================================ */
  /*  Step 2: Fotky                                                     */
  /* ================================================================ */
  const Step2 = () => (
    <Card className="p-6 md:p-8">
      <h2 className="text-lg font-bold text-gray-900 mb-2">
        Fotky
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Doporučujeme min. 5 fotek. Čím více fotek, tím rychleji prodáte.
      </p>

      {/* Drag & drop area */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-[32px] mx-auto">
          📷
        </div>
        <p className="text-gray-700 font-semibold mt-4">
          Přetáhněte fotky sem
        </p>
        <p className="text-sm text-gray-400 mt-2">
          nebo klikněte pro výběr z galerie
        </p>
      </div>

      {/* Placeholder thumbnail grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-2xl"
          >
            +
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={() => setStep(1)}>
          &larr; Zpět
        </Button>
        <Button variant="primary" onClick={() => setStep(3)}>
          Pokračovat &rarr;
        </Button>
      </div>
    </Card>
  );

  /* ================================================================ */
  /*  Step 3: Kontakt                                                   */
  /* ================================================================ */
  const Step3 = () => (
    <Card className="p-6 md:p-8">
      <h2 className="text-lg font-bold text-gray-900 mb-6">
        Kontaktní údaje
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Jméno */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Jméno
          </label>
          <input
            type="text"
            placeholder="Vaše jméno"
            className={inputClass}
            value={formData.jmeno}
            onChange={(e) => updateField("jmeno", e.target.value)}
            required
          />
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Telefon <span className="text-orange-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="+420 xxx xxx xxx"
            className={inputClass}
            value={formData.telefon}
            onChange={(e) => updateField("telefon", e.target.value)}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Email{" "}
            <span className="font-normal text-gray-400">(volitelné)</span>
          </label>
          <input
            type="email"
            placeholder="vas@email.cz"
            className={inputClass}
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        {/* Město */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Město
          </label>
          <select
            className={inputClass}
            value={formData.mesto}
            onChange={(e) => updateField("mesto", e.target.value)}
            required
          >
            <option value="">Vyberte město</option>
            {mesta.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={() => setStep(2)}>
          &larr; Zpět
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Odesílám..." : "Publikovat inzerát"}
        </Button>
      </div>
    </Card>
  );

  /* ================================================================ */
  /*  Render                                                            */
  /* ================================================================ */
  return (
    <div>
      <StepIndicator />
      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}
    </div>
  );
}

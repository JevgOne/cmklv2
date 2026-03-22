"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function ProverkaForm() {
  const [vin, setVin] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Prověrka vozidla",
          email,
          message: `[Prověrka vozidla] VIN: ${vin}`,
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
        Prověřte si vozidlo
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Zadejte VIN a my prověříme kompletní historii vozu
      </p>

      {submitted ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Prověrka zahájena!
          </h3>
          <p className="text-gray-600">
            Report obdržíte na email do několika minut.
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
            label="VIN kód vozidla"
            placeholder="např. TMBEA61Z002345678"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            maxLength={17}
            required
          />

          <Input
            label="Váš e-mail"
            type="email"
            placeholder="jan@email.cz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button variant="primary" size="lg" className="w-full" type="submit" disabled={submitting}>
            {submitting ? "Odesílám..." : "Prověřit vozidlo"}
          </Button>

          <p className="text-center text-sm text-gray-500">
            <span className="font-semibold text-orange-500">od 490 Kč</span>
            {" "}za kompletní report
          </p>
        </form>
      )}
    </Card>
  );
}

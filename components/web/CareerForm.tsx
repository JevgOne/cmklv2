"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";

const cityOptions = [
  { value: "praha", label: "Praha" },
  { value: "brno", label: "Brno" },
  { value: "ostrava", label: "Ostrava" },
  { value: "plzen", label: "Plzeň" },
  { value: "liberec", label: "Liberec" },
  { value: "olomouc", label: "Olomouc" },
  { value: "hradec-kralove", label: "Hradec Králové" },
  { value: "ceske-budejovice", label: "České Budějovice" },
  { value: "pardubice", label: "Pardubice" },
  { value: "jine", label: "Jiné" },
];

export function CareerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fullMessage = `[Kariéra${city ? ` - ${city}` : ""}] ${message}`;
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message: fullMessage }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se odeslat přihlášku");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nepodařilo se odeslat přihlášku"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Přihláška odeslána!
        </h3>
        <p className="text-gray-500">
          Děkujeme za váš zájem. Ozveme se vám co nejdříve.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors cursor-pointer bg-transparent border-none"
        >
          Odeslat další přihlášku
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-8">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input label="Jméno a příjmení" placeholder="Jan Novák" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="E-mail" type="email" placeholder="jan@email.cz" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Telefon" type="tel" placeholder="+420 777 123 456" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Select
          label="Město"
          placeholder="Vyberte město"
          options={cityOptions}
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <Textarea
          label="Zpráva"
          placeholder="Napište nám proč chcete spolupracovat s CarMakléř..."
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button variant="primary" size="lg" type="submit" className="mt-2" disabled={submitting}>
          {submitting ? "Odesílám..." : "Odeslat"}
        </Button>
      </form>
    </Card>
  );
}

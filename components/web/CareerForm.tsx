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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input label="Jméno a příjmení" placeholder="Jan Novák" required />
        <Input label="E-mail" type="email" placeholder="jan@email.cz" required />
        <Input label="Telefon" type="tel" placeholder="+420 777 123 456" required />
        <Select
          label="Město"
          placeholder="Vyberte město"
          options={cityOptions}
        />
        <Textarea
          label="Zpráva"
          placeholder="Napište nám proč chcete spolupracovat s CarMakléř..."
          rows={4}
        />
        <Button variant="primary" size="lg" type="submit" className="mt-2">
          Odeslat
        </Button>
      </form>
    </Card>
  );
}

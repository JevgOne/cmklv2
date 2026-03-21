"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";

const subjectOptions = [
  { value: "obecny", label: "Obecný dotaz" },
  { value: "prodej", label: "Prodej" },
  { value: "koupe", label: "Koupě" },
  { value: "spoluprace", label: "Spolupráce" },
  { value: "jine", label: "Jiné" },
];

export function ContactPageForm() {
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
          Zpráva odeslána!
        </h3>
        <p className="text-gray-500">
          Děkujeme za vaši zprávu. Ozveme se vám co nejdříve.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors cursor-pointer bg-transparent border-none"
        >
          Odeslat další zprávu
        </button>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Napište nám zprávu
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input label="Jméno" placeholder="Jan Novák" required />
        <Input label="E-mail" type="email" placeholder="jan@email.cz" required />
        <Select
          label="Předmět"
          placeholder="Vyberte předmět"
          options={subjectOptions}
        />
        <Textarea
          label="Zpráva"
          placeholder="Napište nám vaši zprávu..."
          rows={5}
        />
        <Button variant="primary" size="lg" type="submit" className="mt-2">
          Odeslat zprávu
        </Button>
      </form>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";

export interface ContactFormProps {
  vehicleName?: string;
  vehicleId?: string;
  className?: string;
}

export function ContactForm({ vehicleName, vehicleId, className }: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    vehicleName
      ? `Dobrý den, mám zájem o ${vehicleName}. Rád/a bych se dozvěděl/a více informací.`
      : ""
  );
  const [wantsVisit, setWantsVisit] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
          email,
          message: message + (wantsVisit ? "\n\nMám zájem o prohlídku vozidla." : ""),
          vehicleId: vehicleId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se odeslat poptávku");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nepodařilo se odeslat poptávku"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        className={cn(
          "bg-white rounded-2xl shadow-card p-8 text-center",
          className
        )}
      >
        <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Poptávka odeslána!
        </h3>
        <p className="text-gray-500">
          Makléř vám odpoví do 30 minut v pracovní době.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setError(null);
          }}
          className="mt-4 text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors"
        >
          Odeslat další poptávku
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn("bg-white rounded-2xl shadow-card p-6 md:p-8", className)}
    >
      <h3 className="text-xl font-bold text-gray-900 mb-1">
        Kontaktovat makléře
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Makléř vám odpoví do 30 minut v pracovní době
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            label="Jméno a příjmení"
            placeholder="Jan Novák"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Telefon"
            type="tel"
            placeholder="+420 xxx xxx xxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <Input
          label="E-mail"
          type="email"
          placeholder="jan@email.cz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Textarea
          label="Zpráva"
          placeholder="Napište svou zprávu..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />

        <Checkbox
          label="Mám zájem o prohlídku vozidla"
          checked={wantsVisit}
          onChange={(e) => setWantsVisit(e.target.checked)}
        />

        <Button
          variant="primary"
          size="lg"
          type="submit"
          className="w-full mt-2"
          disabled={submitting}
        >
          {submitting ? "Odesílám..." : "Odeslat poptávku"}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          Odesláním souhlasíte se zpracováním osobních údajů za účelem
          odpovědi na vaši poptávku.
        </p>
      </form>
    </div>
  );
}

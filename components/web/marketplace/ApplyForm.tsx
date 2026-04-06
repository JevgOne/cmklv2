"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";

type Role = "VERIFIED_DEALER" | "INVESTOR";

export function ApplyForm() {
  const [role, setRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Message (required by API)
  const [message, setMessage] = useState("");

  // Dealer
  const [companyName, setCompanyName] = useState("");
  const [ico, setIco] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          companyName: role === "VERIFIED_DEALER" ? companyName : undefined,
          ico: role === "VERIFIED_DEALER" ? ico : undefined,
          message,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chyba při odesílání");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neočekávaná chyba");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          ✓
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Žádost odeslána!</h3>
        <p className="text-gray-500">
          Děkujeme za zájem. Váš profil prověříme a ozveme se vám do 48 hodin.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8 max-w-lg mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Žádost o přístup</h3>

      {/* Role selection */}
      {!role && (
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRole("VERIFIED_DEALER")}
            className={cn(
              "p-6 rounded-xl border-2 border-gray-200 bg-white text-center cursor-pointer transition-all hover:border-orange-300 hover:bg-orange-50"
            )}
          >
            <span className="text-3xl block mb-3">🚗</span>
            <span className="font-bold text-gray-900 block">Jsem realizátor</span>
            <span className="text-sm text-gray-500 mt-1 block">Chci nabízet auta k flipování</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("INVESTOR")}
            className={cn(
              "p-6 rounded-xl border-2 border-gray-200 bg-white text-center cursor-pointer transition-all hover:border-orange-300 hover:bg-orange-50"
            )}
          >
            <span className="text-3xl block mb-3">💰</span>
            <span className="font-bold text-gray-900 block">Chci investovat</span>
            <span className="text-sm text-gray-500 mt-1 block">Chci financovat flipy aut</span>
          </button>
        </div>
      )}

      {/* Form */}
      {role && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setRole(null)}
            className="text-sm text-orange-500 font-semibold cursor-pointer bg-transparent border-none hover:text-orange-600"
          >
            &larr; Změnit roli
          </button>

          <Input label="Jméno a příjmení" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Telefon" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

          {role === "VERIFIED_DEALER" && (
            <>
              <Input label="Název firmy" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              <Input label="IČO" value={ico} onChange={(e) => setIco(e.target.value)} />
            </>
          )}

          <Textarea
            label="Zpráva"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Popište své zkušenosti, motivaci a proč chcete přístup k marketplace..."
            rows={4}
          />

          {error && (
            <Alert variant="error">
              <span className="text-sm">{error}</span>
            </Alert>
          )}

          <Button
            variant="primary"
            className="w-full"
            disabled={submitting || !name || !email || message.length < 10}
            onClick={handleSubmit}
          >
            {submitting ? "Odesílám..." : "Odeslat žádost"}
          </Button>
        </div>
      )}
    </Card>
  );
}

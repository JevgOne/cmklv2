"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export default function PartnerOnboardingProfilePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [ico, setIco] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [description, setDescription] = useState("");

  const icoValid = /^\d{8}$/.test(ico);
  const isValid = companyName.trim() !== "" && icoValid && phone.trim() !== "";

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/partner-onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 1,
          data: { companyName, ico, phone, street, city, zip, description },
        }),
      });

      if (res.ok) {
        router.push("/partner/onboarding/documents");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Uložení se nezdařilo");
      }
    } catch {
      setError("Chyba připojení, zkuste to znovu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-6 space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">1</div>
          <span className="text-xs font-medium text-gray-900">Profil</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 rounded-full" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">2</div>
          <span className="text-xs font-medium text-gray-400">Dokumenty</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 rounded-full" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">3</div>
          <span className="text-xs font-medium text-gray-400">Schválení</span>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900">Informace o firmě</h2>
        <p className="text-sm text-gray-500 mt-1">Vyplňte základní údaje o vaší firmě</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>
      )}

      <Input
        label="Název firmy *"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="např. AutoBazar Praha s.r.o."
      />

      <div>
        <Input
          label="IČO *"
          value={ico}
          onChange={(e) => setIco(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="12345678"
          maxLength={8}
        />
        {ico && !icoValid && (
          <p className="text-xs text-red-500 mt-1">IČO musí mít přesně 8 číslic</p>
        )}
      </div>

      <Input
        label="Telefon *"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+420 xxx xxx xxx"
      />

      <Input
        label="Ulice"
        value={street}
        onChange={(e) => setStreet(e.target.value)}
        placeholder="Hlavní 123"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Město"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Praha"
        />
        <Input
          label="PSČ"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="110 00"
          maxLength={6}
        />
      </div>

      <Textarea
        label="Popis firmy (nepovinné)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Krátký popis vaší činnosti..."
        className="min-h-[80px]"
      />

      <div className="pt-4">
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-gradient-to-br from-orange-500 to-orange-600"
          onClick={handleSubmit}
          disabled={!isValid || submitting}
        >
          {submitting ? "Ukládám..." : "Pokračovat"}
        </Button>
      </div>
    </div>
  );
}

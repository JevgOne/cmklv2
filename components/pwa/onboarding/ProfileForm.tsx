"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { BROKER_SPECIALIZATIONS } from "@/lib/broker-specializations";
import { StepComplete } from "./StepComplete";

const SPECIALIZATIONS = BROKER_SPECIALIZATIONS.vehicleTypes;

const BIO_QUESTIONS = [
  { key: "experience", label: "Kolik let máte zkušeností s prodejem aut?", placeholder: "Např. 5 let" },
  { key: "region", label: "V jakém regionu/městě působíte?", placeholder: "Např. Praha a okolí" },
  { key: "brands", label: "Jaké značky aut preferujete?", placeholder: "Např. Škoda, VW, BMW" },
  { key: "motivation", label: "Co vás baví na prodeji aut?", placeholder: "Např. Pomáhat lidem najít správné auto" },
  { key: "vehicle_types", label: "Jaký typ vozidel nejčastěji prodáváte?", placeholder: "Např. SUV, osobní, dodávky" },
  { key: "certifications", label: "Máte certifikace nebo kurzy?", placeholder: "Např. Autorizovaný prodejce Škoda" },
  { key: "differentiator", label: "Co vás odlišuje od ostatních makléřů?", placeholder: "Např. Osobní přístup, rychlost" },
] as const;

export function ProfileForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [bioAnswers, setBioAnswers] = useState<Record<string, string>>({});
  const [generatedBio, setGeneratedBio] = useState("");
  const [generatingBio, setGeneratingBio] = useState(false);
  const [bioEdited, setBioEdited] = useState(false);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [cities, setCities] = useState("");
  const [iban, setIban] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleSpecialization = (value: string) => {
    setSpecializations((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const updateAnswer = (key: string, value: string) => {
    setBioAnswers((prev) => ({ ...prev, [key]: value }));
    setBioEdited(false);
  };

  const handleGenerateBio = async () => {
    const filledAnswers = BIO_QUESTIONS.filter((q) => bioAnswers[q.key]?.trim());
    if (filledAnswers.length < 3) {
      setError("Vyplňte alespoň 3 otázky pro generování bio.");
      return;
    }

    setGeneratingBio(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: bioAnswers }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedBio(data.bio);
        setBioEdited(false);
      } else {
        // Fallback: construct simple bio from answers
        const parts = BIO_QUESTIONS.map((q) => bioAnswers[q.key])
          .filter(Boolean);
        setGeneratedBio(parts.join(". ") + ".");
      }
    } catch {
      // Fallback
      const parts = BIO_QUESTIONS.map((q) => bioAnswers[q.key])
        .filter(Boolean);
      setGeneratedBio(parts.join(". ") + ".");
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const bio = generatedBio || Object.values(bioAnswers).filter(Boolean).join(". ");

    try {
      const formData = new FormData();
      if (photo) formData.append("photo", photo);
      formData.append("bio", bio);
      formData.append("specializations", JSON.stringify(specializations));
      formData.append("cities", JSON.stringify(cities.split(",").map((c) => c.trim()).filter(Boolean)));
      formData.append("iban", iban);

      const res = await fetch("/api/onboarding/profile", {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Uložení profilu se nezdařilo.");
        setLoading(false);
        return;
      }

      setShowCelebration(true);
    } catch {
      setError("Došlo k neočekávané chybě. Zkuste to znovu.");
      setLoading(false);
    }
  };

  const handleContinue = useCallback(() => {
    router.push("/makler/onboarding/documents");
  }, [router]);

  const filledCount = BIO_QUESTIONS.filter((q) => bioAnswers[q.key]?.trim()).length;

  return (
    <>
    {showCelebration && (
      <StepComplete step={1} emoji="👤" title="Profil hotový!" subtitle="Skvělý start — pokračujeme dokumenty." onContinue={handleContinue} />
    )}
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {/* Profile photo */}
      <div>
        <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
          Profilová fotka
        </label>
        <div className="flex items-center gap-4">
          <div
            className="relative w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-orange-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              <Image src={photoPreview} alt="Preview" fill className="object-cover" unoptimized />
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
          </div>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Nahrát fotku
            </Button>
            <p className="text-xs text-gray-400 mt-1">JPG nebo PNG, max 5 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      </div>

      {/* Bio questions */}
      <div>
        <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
          O mně — odpovězte na otázky
        </label>
        <p className="text-xs text-gray-500 mb-4">
          Z vašich odpovědí AI vygeneruje profesionální popisek profilu. Vyplňte alespoň 3 otázky.
        </p>
        <div className="space-y-3">
          {BIO_QUESTIONS.map((q) => (
            <div key={q.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {q.label}
              </label>
              <input
                type="text"
                value={bioAnswers[q.key] ?? ""}
                onChange={(e) => updateAnswer(q.key, e.target.value)}
                placeholder={q.placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateBio}
            disabled={generatingBio || filledCount < 3}
          >
            {generatingBio ? "Generuji..." : `Vygenerovat bio (${filledCount}/7 odpovědí)`}
          </Button>
        </div>

        {/* Generated bio preview */}
        {generatedBio && (
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Vygenerovaný popis (můžete upravit):
            </label>
            <Textarea
              value={generatedBio}
              onChange={(e) => {
                setGeneratedBio(e.target.value);
                setBioEdited(true);
              }}
              rows={4}
              className="text-sm"
            />
            {!bioEdited && (
              <p className="text-xs text-green-600 mt-1">
                AI vygenerovala popis z vašich odpovědí
              </p>
            )}
          </div>
        )}
      </div>

      {/* Specializations */}
      <div>
        <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
          Specializace
        </label>
        <div className="flex flex-wrap gap-3">
          {SPECIALIZATIONS.map((spec) => (
            <Checkbox
              key={spec}
              label={spec}
              checked={specializations.includes(spec)}
              onChange={() => toggleSpecialization(spec)}
            />
          ))}
        </div>
      </div>

      {/* Cities */}
      <Input
        label="Města působnosti"
        value={cities}
        onChange={(e) => setCities(e.target.value)}
        placeholder="Praha, Brno, Ostrava"
      />
      <p className="text-xs text-gray-400 -mt-4">Oddělujte čárkou</p>

      {/* IBAN */}
      <Input
        label="Bankovní účet"
        value={iban}
        onChange={(e) => setIban(e.target.value)}
        placeholder="1234567890/0800"
      />

      <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
        {loading ? "Ukládám..." : "Pokračovat"}
      </Button>
    </form>
    </>
  );
}

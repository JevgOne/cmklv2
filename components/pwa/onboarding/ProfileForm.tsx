"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";

const SPECIALIZATIONS = [
  { value: "personal", label: "Osobni" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Dodavky" },
  { value: "luxury", label: "Luxusni" },
  { value: "electric", label: "Elektromobily" },
];

export function ProfileForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [bio, setBio] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

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
        setError(data.error || "Ulozeni profilu se nezdarilo.");
        setLoading(false);
        return;
      }

      router.push("/makler/onboarding/documents");
    } catch {
      setError("Doslo k neocekavane chybe. Zkuste to znovu.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {/* Profile photo */}
      <div>
        <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
          Profilova fotka
        </label>
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-orange-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
          </div>
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Nahrat fotku
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

      {/* Bio */}
      <Textarea
        label="O mne"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Kratce se predstavte potencialnim klientum..."
        rows={4}
      />

      {/* Specializations */}
      <div>
        <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-3 block">
          Specializace
        </label>
        <div className="flex flex-wrap gap-3">
          {SPECIALIZATIONS.map((spec) => (
            <Checkbox
              key={spec.value}
              label={spec.label}
              checked={specializations.includes(spec.value)}
              onChange={() => toggleSpecialization(spec.value)}
            />
          ))}
        </div>
      </div>

      {/* Cities */}
      <Input
        label="Mesta pusobnosti"
        value={cities}
        onChange={(e) => setCities(e.target.value)}
        placeholder="Praha, Brno, Ostrava"
      />
      <p className="text-xs text-gray-400 -mt-4">Oddelujte carkou</p>

      {/* IBAN */}
      <Input
        label="Bankovni ucet (IBAN)"
        value={iban}
        onChange={(e) => setIban(e.target.value)}
        placeholder="CZ65 0800 0000 1920 0014 5399"
      />

      <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
        {loading ? "Ukladam..." : "Pokracovat"}
      </Button>
    </form>
  );
}

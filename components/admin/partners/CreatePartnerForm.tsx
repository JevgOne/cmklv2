"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

const TYPE_OPTIONS = [
  { value: "AUTOBAZAR", label: "Autobazar" },
  { value: "VRAKOVISTE", label: "Vrakoviště" },
];

const REGION_OPTIONS = [
  { value: "Praha", label: "Praha" },
  { value: "Středočeský", label: "Středočeský" },
  { value: "Jihočeský", label: "Jihočeský" },
  { value: "Plzeňský", label: "Plzeňský" },
  { value: "Karlovarský", label: "Karlovarský" },
  { value: "Ústecký", label: "Ústecký" },
  { value: "Liberecký", label: "Liberecký" },
  { value: "Královéhradecký", label: "Královéhradecký" },
  { value: "Pardubický", label: "Pardubický" },
  { value: "Vysočina", label: "Vysočina" },
  { value: "Jihomoravský", label: "Jihomoravský" },
  { value: "Olomoucký", label: "Olomoucký" },
  { value: "Zlínský", label: "Zlínský" },
  { value: "Moravskoslezský", label: "Moravskoslezský" },
];

interface FormData {
  type: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  ico: string;
  address: string;
  city: string;
  region: string;
  zip: string;
  notes: string;
}

interface Credentials {
  email: string;
  temporaryPassword: string;
}

interface CreateResult {
  partner: { id: string; name: string; slug: string; type: string };
  credentials: Credentials;
}

const INITIAL_FORM: FormData = {
  type: "AUTOBAZAR",
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  ico: "",
  address: "",
  city: "",
  region: "",
  zip: "",
  notes: "",
};

export function CreatePartnerForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState(false);

  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setError(null);
    },
    []
  );

  const isValid =
    form.type &&
    form.name.trim() &&
    form.contactPerson.trim() &&
    form.email.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const handleSubmit = useCallback(async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/partners/create-with-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Chyba při vytváření účtu");
        return;
      }

      setResult(json as CreateResult);
    } catch {
      setError("Nepodařilo se vytvořit účet. Zkuste to znovu.");
    } finally {
      setSubmitting(false);
    }
  }, [form, isValid, submitting]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = `Email: ${result.credentials.email}\nHeslo: ${result.credentials.temporaryPassword}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleCloseModal = useCallback(() => {
    if (result) {
      router.push(`/admin/partners/${result.partner.id}`);
    }
  }, [result, router]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <button
              onClick={() => router.push("/admin/partners")}
              className="hover:text-gray-900 transition-colors"
            >
              Partneri
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">Novy partner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Vytvorit ucet partnera
          </h1>
        </div>
      </div>

      <Card className="p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Typ partnera */}
          <Select
            label="Typ partnera *"
            value={form.type}
            onChange={(e) => updateField("type", e.target.value)}
            options={TYPE_OPTIONS}
          />

          {/* Nazev + kontaktni osoba */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nazev firmy *"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Např. Auto Novák s.r.o."
            />
            <Input
              label="Kontaktni osoba *"
              value={form.contactPerson}
              onChange={(e) => updateField("contactPerson", e.target.value)}
              placeholder="Např. Jan Novák"
            />
          </div>

          {/* Email + telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email *"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="partner@firma.cz"
            />
            <Input
              label="Telefon"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+420 ..."
            />
          </div>

          {/* ICO */}
          <Input
            label="ICO"
            value={form.ico}
            onChange={(e) => updateField("ico", e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="12345678"
            maxLength={8}
          />

          {/* Adresa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Adresa"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Ulice a číslo"
            />
            <Input
              label="Město"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Město"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Kraj"
              value={form.region}
              onChange={(e) => updateField("region", e.target.value)}
              options={REGION_OPTIONS}
              placeholder="Vyberte kraj"
            />
            <Input
              label="PSC"
              value={form.zip}
              onChange={(e) => updateField("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="11000"
              maxLength={5}
            />
          </div>

          {/* Poznamky */}
          <Textarea
            label="Poznámky"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Interní poznámky k partnerovi..."
            rows={3}
          />

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/partners")}
            >
              Zrušit
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!isValid || submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Vytvářím...
                </span>
              ) : (
                "Vytvořit účet"
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Success modal */}
      <Modal
        open={result !== null}
        onClose={handleCloseModal}
        title="Účet vytvořen"
      >
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{result.partner.name}</p>
                <p className="text-sm text-gray-500">
                  {result.partner.type === "AUTOBAZAR" ? "Autobazar" : "Vrakoviště"}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Email:</span>
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {result.credentials.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Dočasné heslo:</span>
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {result.credentials.temporaryPassword}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopy}
            >
              {copied ? "Zkopírováno!" : "Zkopírovat údaje"}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Partnerovi byl odeslán email s přihlašovacími údaji.
            </p>

            <Button
              variant="primary"
              className="w-full"
              onClick={handleCloseModal}
            >
              Hotovo
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

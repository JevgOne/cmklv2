"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import Link from "next/link";

type PartnerType = "AUTOBAZAR" | "VRAKOVISTE";

interface PartnerForm {
  type: PartnerType | "";
  companyName: string;
  ico: string;
  contactName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
  street: string;
  city: string;
  zip: string;
  description: string;
}

const initial: PartnerForm = {
  type: "",
  companyName: "",
  ico: "",
  contactName: "",
  email: "",
  phone: "",
  password: "",
  passwordConfirm: "",
  street: "",
  city: "",
  zip: "",
  description: "",
};

export default function PartnerRegistracePage() {
  const [form, setForm] = useState<PartnerForm>(initial);
  const [aresLoading, setAresLoading] = useState(false);
  const [aresResult, setAresResult] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PartnerForm, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = (field: keyof PartnerForm, value: string) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  };

  const verifyIco = async () => {
    const ico = form.ico.replace(/\s/g, "").trim();
    if (!/^\d{8}$/.test(ico)) {
      setErrors({ ...errors, ico: "IČO musí mít 8 číslic" });
      return;
    }

    setAresLoading(true);
    setAresResult(null);

    try {
      const res = await fetch(`/api/ares?ico=${ico}`);

      if (res.status === 404) {
        setAresResult("IČO nebylo nalezeno v ARES");
        return;
      }

      if (!res.ok) {
        setAresResult("Chyba při ověření IČO");
        return;
      }

      const data = await res.json();

      setForm({
        ...form,
        companyName: data.name || form.companyName,
        city: data.city || form.city,
        zip: data.zip || form.zip,
        street: data.address || form.street,
      });

      setAresResult(`Ověřeno: ${data.name}`);
    } catch {
      setAresResult("Nepodařilo se ověřit IČO");
    } finally {
      setAresLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PartnerForm, string>> = {};
    if (!form.type) newErrors.type = "Vyberte typ partnera";
    if (!form.companyName.trim()) newErrors.companyName = "Vyplňte název firmy";
    if (!form.ico.trim()) newErrors.ico = "Vyplňte IČO";
    else if (!/^\d{8}$/.test(form.ico.replace(/\s/g, ""))) newErrors.ico = "IČO musí mít 8 číslic";
    if (!form.contactName.trim()) newErrors.contactName = "Vyplňte kontaktní osobu";
    if (!form.email.trim() || !form.email.includes("@")) newErrors.email = "Vyplňte platný email";
    if (!form.phone.trim()) newErrors.phone = "Vyplňte telefon";
    if (form.password.length < 8) newErrors.password = "Heslo musí mít alespoň 8 znaků";
    if (form.password !== form.passwordConfirm) newErrors.passwordConfirm = "Hesla se neshodují";
    if (!form.city.trim()) newErrors.city = "Vyplňte město";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/auth/register/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          ico: form.ico.replace(/\s/g, ""),
          type: form.type,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          street: form.street || undefined,
          city: form.city || undefined,
          zip: form.zip || undefined,
          description: form.description || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          throw new Error(data.error || "Uživatel s tímto emailem nebo IČO již existuje");
        }
        if (data.details) {
          throw new Error(data.details.map((d: { message: string }) => d.message).join(", "));
        }
        throw new Error(data.error || "Nepodařilo se dokončit registraci");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Nepodařilo se dokončit registraci"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-green-600">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
              Registrace úspěšná!
            </h1>
            <p className="text-gray-500 mb-6">
              Váš účet byl vytvořen. Nyní ověříme vaše údaje a po schválení
              budete moci přistupovat do partnerského portálu. Ověření obvykle trvá 1-2 pracovní dny.
            </p>
            <Button variant="primary" onClick={() => (window.location.href = "/login")}>
              Přejít na přihlášení
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <span className="inline-block bg-orange-100 text-orange-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Partnerský program
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Registrace partnera
          </h1>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Zaregistrujte svůj autobazar nebo vrakoviště a začněte spolupracovat s CarMakléř.
          </p>
        </div>
      </section>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6 sm:p-8 space-y-6">
          {/* Typ partnera */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-3">
              Typ partnera *
            </label>
            {errors.type && (
              <span className="text-xs text-error-500 block mb-2">{errors.type}</span>
            )}
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "AUTOBAZAR" as const, label: "Autobazar", desc: "Prodej vozidel" },
                { value: "VRAKOVISTE" as const, label: "Vrakoviště", desc: "Prodej dílů" },
              ]).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update("type", option.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all cursor-pointer bg-white",
                    form.type === option.value
                      ? "border-orange-500 bg-orange-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="font-semibold text-gray-900 text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900">Údaje o firmě</h2>

          {/* ICO with ARES verify */}
          <div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="IČO *"
                  value={form.ico}
                  onChange={(e) => update("ico", e.target.value)}
                  error={errors.ico}
                  placeholder="12345678"
                  maxLength={8}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={verifyIco}
                disabled={aresLoading}
                className="shrink-0 mb-0.5"
              >
                {aresLoading ? "Ověřuji..." : "Ověřit ARES"}
              </Button>
            </div>
            {aresResult && (
              <p className={`text-xs mt-1 ${aresResult.startsWith("Ověřeno") ? "text-green-600" : "text-orange-500"}`}>
                {aresResult}
              </p>
            )}
          </div>

          <Input
            label="Název firmy *"
            value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            error={errors.companyName}
            placeholder="AutoBazar Praha s.r.o."
          />

          <Input
            label="Kontaktní osoba *"
            value={form.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            error={errors.contactName}
            placeholder="Jan Novák"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email *"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              error={errors.email}
              placeholder="info@autobazar.cz"
            />
            <Input
              label="Telefon *"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              error={errors.phone}
              placeholder="+420 777 123 456"
            />
          </div>

          <h2 className="text-lg font-bold text-gray-900 pt-2">Přístupové údaje</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Heslo *"
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              error={errors.password}
              placeholder="Minimálně 8 znaků"
            />
            <Input
              label="Potvrzení hesla *"
              type="password"
              value={form.passwordConfirm}
              onChange={(e) => update("passwordConfirm", e.target.value)}
              error={errors.passwordConfirm}
              placeholder="Zopakujte heslo"
            />
          </div>

          <h2 className="text-lg font-bold text-gray-900 pt-2">Adresa provozovny</h2>

          <Input
            label="Ulice a číslo"
            value={form.street}
            onChange={(e) => update("street", e.target.value)}
            error={errors.street}
            placeholder="Průmyslová 45"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Město *"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              error={errors.city}
              placeholder="Praha"
            />
            <Input
              label="PSČ"
              value={form.zip}
              onChange={(e) => update("zip", e.target.value)}
              error={errors.zip}
              placeholder="110 00"
            />
          </div>

          <Textarea
            label="O vašem podniku (nepovinné)"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Popište váš podnik -- specializace, kapacita, nabídka..."
            className="min-h-[100px]"
          />

          {submitError && (
            <Alert variant="error">
              {submitError}
            </Alert>
          )}

          <Alert variant="info">
            Po registraci ověříme vaše údaje a do 1-2 pracovních dnů aktivujeme váš účet.
            Poté se budete moci přihlásit do partnerského portálu.
          </Alert>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Odesílám..." : "Zaregistrovat se"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Máte účet?{" "}
              <Link href="/login" className="font-medium text-orange-600 hover:text-orange-700">
                Přihlásit se
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

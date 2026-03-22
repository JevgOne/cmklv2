"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";

interface SupplierForm {
  companyName: string;
  ico: string;
  contactName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  description: string;
}

export default function DodavatelRegistracePage() {
  const [form, setForm] = useState<SupplierForm>({
    companyName: "",
    ico: "",
    contactName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    zip: "",
    description: "",
  });
  const [aresLoading, setAresLoading] = useState(false);
  const [aresResult, setAresResult] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SupplierForm, string>>>({});

  const update = (field: keyof SupplierForm, value: string) => {
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
      const res = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`, {
        headers: { Accept: "application/json" },
      });

      if (res.status === 404) {
        setAresResult("IČO nebylo nalezeno v ARES");
        return;
      }

      if (!res.ok) {
        setAresResult("Chyba při ověření IČO");
        return;
      }

      const data = await res.json();
      const name = data.obchodniJmeno || data.jmeno || "";
      const address = data.sidlo;

      setForm({
        ...form,
        companyName: name || form.companyName,
        city: address?.nazevObce || form.city,
        zip: address?.psc ? String(address.psc) : form.zip,
        street: address?.nazevUlice
          ? `${address.nazevUlice}${address.cisloDomovni ? ` ${address.cisloDomovni}` : ""}${address.cisloOrientacni ? `/${address.cisloOrientacni}` : ""}`
          : form.street,
      });

      setAresResult(`Ověřeno: ${name}`);
    } catch {
      setAresResult("Nepodařilo se ověřit IČO");
    } finally {
      setAresLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SupplierForm, string>> = {};
    if (!form.companyName.trim()) newErrors.companyName = "Vyplňte název firmy";
    if (!form.ico.trim()) newErrors.ico = "Vyplňte IČO";
    if (!form.contactName.trim()) newErrors.contactName = "Vyplňte kontaktní osobu";
    if (!form.email.trim() || !form.email.includes("@")) newErrors.email = "Vyplňte platný email";
    if (!form.phone.trim()) newErrors.phone = "Vyplňte telefon";
    if (!form.street.trim()) newErrors.street = "Vyplňte adresu";
    if (!form.city.trim()) newErrors.city = "Vyplňte město";
    if (!form.zip.trim()) newErrors.zip = "Vyplňte PSČ";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.contactName,
          email: form.email,
          phone: form.phone,
          message: `[Registrace dodavatele] Firma: ${form.companyName}, IČO: ${form.ico}, Adresa: ${form.street}, ${form.city} ${form.zip}. ${form.description || ""}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se odeslat registraci");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Nepodařilo se odeslat registraci"
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
              Registrace odeslána!
            </h1>
            <p className="text-gray-500 mb-6">
              Vaši žádost nyní ověříme. Po schválení vám přijde email s přístupovými údaji do dodavatelské aplikace.
              Ověření obvykle trvá 1-2 pracovní dny.
            </p>
            <Button variant="primary" onClick={() => (window.location.href = "/shop")}>
              Zpět do shopu
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <span className="inline-block bg-green-100 text-green-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Pro vrakoviště a dodavatele
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Registrace dodavatele dílů
          </h1>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Přidávejte díly z vašeho vrakoviště přes jednoduchou mobilní aplikaci.
            Přístup k tisícům zákazníků z celé ČR.
          </p>
        </div>
      </section>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6 sm:p-8 space-y-6">
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
            placeholder="Vrakoviště s.r.o."
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
              placeholder="info@vrakoviste.cz"
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

          <h2 className="text-lg font-bold text-gray-900 pt-2">Adresa skladu/vrakoviště</h2>

          <Input
            label="Ulice a číslo *"
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
              label="PSČ *"
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
            placeholder="Popište váš podnik — typ dílů, specializace, kapacita..."
            className="min-h-[100px]"
          />

          {submitError && (
            <Alert variant="error">
              {submitError}
            </Alert>
          )}

          <Alert variant="info">
            Po odeslání registrace ověříme vaše údaje a do 1-2 pracovních dnů vám zašleme přístup do dodavatelské aplikace.
          </Alert>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Odesílám..." : "Odeslat registraci"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

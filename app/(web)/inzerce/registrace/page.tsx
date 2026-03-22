"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";

type AccountType = "PRIVATE" | "DEALER" | "BAZAAR" | "BUYER";

interface FormState {
  accountType: AccountType | "";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
  companyName: string;
  ico: string;
}

interface AresData {
  companyName: string;
  ico: string;
  address?: string;
}

const accountTypes: { value: AccountType; label: string; desc: string }[] = [
  { value: "PRIVATE", label: "Soukromý prodejce", desc: "Prodáváte vlastní auto" },
  { value: "BAZAAR", label: "Autobazar", desc: "Provozujete autobazar" },
  { value: "DEALER", label: "Dealer / autosalon", desc: "Autorizovaný prodejce" },
  { value: "BUYER", label: "Kupující", desc: "Hledáte auto ke koupi" },
];

const initial: FormState = {
  accountType: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  passwordConfirm: "",
  companyName: "",
  ico: "",
};

export default function InzerceRegistracePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [aresLoading, setAresLoading] = useState(false);
  const [aresData, setAresData] = useState<AresData | null>(null);
  const [aresError, setAresError] = useState("");

  const isCompany = form.accountType === "DEALER" || form.accountType === "BAZAAR";

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateIco = (ico: string): boolean => {
    return /^\d{8}$/.test(ico);
  };

  const handleAresLookup = async () => {
    if (!validateIco(form.ico)) {
      setAresError("ICO musí mít přesně 8 číslic");
      return;
    }

    setAresLoading(true);
    setAresError("");
    setAresData(null);

    try {
      const res = await fetch(`/api/auth/register/ares?ico=${encodeURIComponent(form.ico)}`);
      const data = await res.json();

      if (!res.ok) {
        setAresError(data.error || "Nepodařilo se ověřit IČO");
        return;
      }

      setAresData(data);
      if (data.companyName) {
        update("companyName", data.companyName);
      }
    } catch {
      setAresError("Chyba při komunikaci s ARES");
    } finally {
      setAresLoading(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.accountType) errs.accountType = "Vyberte typ účtu";
    if (!form.firstName.trim()) errs.firstName = "Jméno je povinné";
    if (!form.lastName.trim()) errs.lastName = "Příjmení je povinné";
    if (!form.email.trim()) {
      errs.email = "Email je povinný";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Neplatný formát emailu";
    }
    if (!form.phone.trim()) errs.phone = "Telefon je povinný";
    if (form.password.length < 8) errs.password = "Heslo musí mít alespoň 8 znaků";
    if (form.password !== form.passwordConfirm) errs.passwordConfirm = "Hesla se neshodují";

    if (isCompany) {
      if (!form.ico.trim()) errs.ico = "IČO je povinné pro firmy";
      else if (!validateIco(form.ico)) errs.ico = "IČO musí mít přesně 8 číslic";
      if (!form.companyName.trim()) errs.companyName = "Název firmy je povinný";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    if (!validate()) return;

    setLoading(true);

    try {
      const role = form.accountType === "BUYER" ? "BUYER" : "ADVERTISER";
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role,
          accountType: form.accountType !== "BUYER" ? form.accountType : undefined,
          companyName: isCompany ? form.companyName : undefined,
          ico: isCompany ? form.ico : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setGlobalError("Uživatel s tímto emailem již existuje");
        } else if (data.details) {
          setGlobalError(data.details.map((d: { message: string }) => d.message).join(", "));
        } else {
          setGlobalError(data.error || "Registrace se nezdařila");
        }
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setGlobalError("Došlo k neočekávané chybě. Zkuste to prosím znovu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/inzerce" className="text-orange-500 hover:text-orange-600 no-underline transition-colors">
              Inzerce
            </Link>
            <span>/</span>
            <span className="text-gray-600">Registrace</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Vytvořte si účet</h1>
          <p className="text-gray-500 mt-2">
            Zaregistrujte se a začněte prodávat nebo nakupovat vozidla.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6 md:p-8">
          {globalError && (
            <Alert variant="error" className="mb-6">
              {globalError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Typ účtu */}
            <div>
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-3">
                Typ účtu
              </label>
              {errors.accountType && (
                <span className="text-[13px] text-error-500 block mb-2">{errors.accountType}</span>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accountTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => update("accountType", type.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all cursor-pointer bg-white",
                      form.accountType === type.value
                        ? "border-orange-500 bg-orange-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="font-semibold text-gray-900 text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Osobní údaje */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Jméno"
                placeholder="Jan"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                error={errors.firstName}
              />
              <Input
                label="Příjmení"
                placeholder="Novák"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                error={errors.lastName}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="vas@email.cz"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              error={errors.email}
            />

            <Input
              label="Telefon"
              type="tel"
              placeholder="+420 123 456 789"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              error={errors.phone}
            />

            {/* Firemní údaje */}
            {isCompany && (
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Firemní údaje</h3>

                <div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Input
                        label="IČO"
                        placeholder="12345678"
                        value={form.ico}
                        onChange={(e) => update("ico", e.target.value.replace(/\D/g, "").slice(0, 8))}
                        error={errors.ico}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAresLookup}
                      disabled={aresLoading || form.ico.length !== 8}
                      className="mb-0.5"
                    >
                      {aresLoading ? "Ověřuji..." : "Ověřit ARES"}
                    </Button>
                  </div>
                  {aresError && (
                    <span className="text-[13px] text-error-500 mt-1 block">{aresError}</span>
                  )}
                  {aresData && (
                    <Alert variant="success" className="mt-2">
                      IČO ověřeno: {aresData.companyName}
                      {aresData.address && <span className="block text-xs mt-1">{aresData.address}</span>}
                    </Alert>
                  )}
                </div>

                <Input
                  label="Název firmy"
                  placeholder="Název firmy s.r.o."
                  value={form.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  error={errors.companyName}
                />
              </div>
            )}

            {/* Heslo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Heslo"
                type="password"
                placeholder="Minimálně 8 znaků"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                error={errors.password}
              />
              <Input
                label="Potvrzení hesla"
                type="password"
                placeholder="Zopakujte heslo"
                value={form.passwordConfirm}
                onChange={(e) => update("passwordConfirm", e.target.value)}
                error={errors.passwordConfirm}
              />
            </div>

            <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
              {loading ? "Registrace..." : "Zaregistrovat se"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Máte účet?{" "}
              <Link href="/login" className="font-medium text-orange-600 hover:text-orange-700">
                Přihlásit se
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}

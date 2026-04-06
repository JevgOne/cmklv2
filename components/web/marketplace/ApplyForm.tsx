"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";

type Role = "VERIFIED_DEALER" | "INVESTOR";
type InvestmentRange = "10k-50k" | "50k-200k" | "200k-1M" | "1M+";

const INVESTMENT_RANGE_LABELS: Record<InvestmentRange, string> = {
  "10k-50k": "10 000 – 50 000 Kč",
  "50k-200k": "50 000 – 200 000 Kč",
  "200k-1M": "200 000 – 1 000 000 Kč",
  "1M+": "1 000 000+ Kč",
};

export interface ApplyFormProps {
  /** Předvolená role (z query param ?role=investor|dealer) */
  initialRole?: Role | null;
}

export function ApplyForm({ initialRole = null }: ApplyFormProps) {
  const [role, setRole] = useState<Role | null>(initialRole);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);

  // Dealer
  const [companyName, setCompanyName] = useState("");
  const [ico, setIco] = useState("");

  // Investor
  const [investmentRange, setInvestmentRange] = useState<InvestmentRange | "">("");

  // Honeypot (must stay empty — bot detection)
  const [website, setWebsite] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          firstName,
          lastName,
          email,
          phone,
          companyName: role === "VERIFIED_DEALER" ? companyName : undefined,
          ico: role === "VERIFIED_DEALER" ? ico : undefined,
          investmentRange: role === "INVESTOR" && investmentRange ? investmentRange : undefined,
          message,
          gdprConsent,
          website, // honeypot — server odmítne pokud vyplněno
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Chyba při odesílání žádosti");
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
        <p className="text-gray-500 mb-4">
          Děkujeme za zájem o CarMakléř marketplace. Váš profil prověříme a ozveme se vám{" "}
          <strong>do 48 hodin</strong>.
        </p>
        <p className="text-sm text-gray-400">
          Na váš email jsme odeslali potvrzení. Pokud jej nevidíte, zkontrolujte spam.
        </p>
      </Card>
    );
  }

  const canSubmit =
    !!role &&
    firstName.length >= 2 &&
    lastName.length >= 2 &&
    email.includes("@") &&
    phone.length >= 9 &&
    message.length >= 10 &&
    gdprConsent &&
    (role === "INVESTOR" || (companyName.length > 0 && /^\d{8}$/.test(ico)));

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

          {/* Honeypot field — vizuálně skrytý, ale bot ho vyplní */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-9999px",
              width: "1px",
              height: "1px",
              overflow: "hidden",
            }}
          >
            <label>
              Webová stránka (nevyplňujte)
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Jméno"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Příjmení"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Telefon"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+420 777 123 456"
            required
          />

          {role === "VERIFIED_DEALER" && (
            <>
              <Input
                label="Název firmy"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <Input
                label="IČO"
                value={ico}
                onChange={(e) => setIco(e.target.value)}
                placeholder="12345678"
                required
              />
            </>
          )}

          {role === "INVESTOR" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Rozsah plánované investice
              </label>
              <select
                value={investmentRange}
                onChange={(e) => setInvestmentRange(e.target.value as InvestmentRange | "")}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:border-orange-500 focus:outline-none transition-colors"
              >
                <option value="">— Vyberte rozsah —</option>
                {(Object.keys(INVESTMENT_RANGE_LABELS) as InvestmentRange[]).map((key) => (
                  <option key={key} value={key}>
                    {INVESTMENT_RANGE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Textarea
            label="Zpráva"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Popište své zkušenosti, motivaci a proč chcete přístup k marketplace..."
            rows={4}
            required
          />

          {/* GDPR consent */}
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              className="mt-1 w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
              required
            />
            <span className="text-gray-600 leading-relaxed">
              Souhlasím se zpracováním osobních údajů za účelem vyřízení žádosti o přístup k
              marketplace. Více v{" "}
              <Link
                href="/ochrana-osobnich-udaju"
                className="text-orange-500 underline hover:text-orange-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                zásadách ochrany osobních údajů
              </Link>
              .
            </span>
          </label>

          {error && (
            <Alert variant="error">
              <span className="text-sm">{error}</span>
            </Alert>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={submitting || !canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? "Odesílám..." : "Odeslat žádost"}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Již máte účet?{" "}
            <Link href="/prihlaseni" className="text-orange-500 hover:underline">
              Přihlaste se
            </Link>
          </p>
        </div>
      )}
    </Card>
  );
}

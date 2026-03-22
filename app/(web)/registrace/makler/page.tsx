"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";

interface InvitationData {
  email: string;
  name?: string;
  manager: string;
  region: { id: string; name: string };
}

type PageState = "loading" | "invalid" | "form" | "submitting" | "success";

export default function BrokerRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [invalidMessage, setInvalidMessage] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [ico, setIco] = useState("");
  const [icoStatus, setIcoStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle");
  const [icoCompany, setIcoCompany] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setInvalidMessage("Chybi pozvankovy token. Pouzijte odkaz z pozvankoveho emailu.");
      setPageState("invalid");
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setInvalidMessage(data.error || "Neplatny nebo expirovaný pozvankovy odkaz.");
          setPageState("invalid");
          return;
        }
        const json = await res.json();
        const inv = json.invitation as InvitationData;
        setInvitation(inv);
        // Pre-fill name if available (single "name" field from invitation)
        if (inv.name) {
          const parts = inv.name.split(" ");
          if (parts.length >= 2) {
            setFirstName(parts[0]);
            setLastName(parts.slice(1).join(" "));
          } else {
            setFirstName(inv.name);
          }
        }
        setPageState("form");
      } catch {
        setInvalidMessage("Nelze overit pozvanku. Zkuste to znovu.");
        setPageState("invalid");
      }
    }

    verifyToken();
  }, [token]);

  // ARES IČO validation
  const validateIco = async (value: string) => {
    const normalized = value.replace(/\s/g, "").trim();
    if (normalized.length !== 8 || !/^\d{8}$/.test(normalized)) {
      setIcoStatus("invalid");
      setIcoCompany("");
      return;
    }

    setIcoStatus("loading");
    try {
      const res = await fetch(`/api/ares?ico=${normalized}`);
      if (res.ok) {
        const data = await res.json();
        setIcoStatus("valid");
        setIcoCompany(data.name || "");
      } else {
        setIcoStatus("invalid");
        setIcoCompany("");
      }
    } catch {
      setIcoStatus("idle");
      setIcoCompany("");
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = "Jmeno je povinne";
    if (!lastName.trim()) errors.lastName = "Prijmeni je povinne";
    if (!phone.trim()) errors.phone = "Telefon je povinny";
    if (password.length < 8) errors.password = "Heslo musi mit alespon 8 znaku";
    if (password !== passwordConfirm) errors.passwordConfirm = "Hesla se neshoduji";
    if (!ico.trim()) errors.ico = "ICO je povinne";
    else if (icoStatus === "invalid") errors.ico = "Neplatne ICO";
    if (!consent) errors.consent = "Musite souhlasit s podminkami";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setPageState("submitting");

    try {
      const res = await fetch("/api/auth/register/broker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          firstName,
          lastName,
          phone,
          ico,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Registrace se nezdarila. Zkuste to znovu.");
        setPageState("form");
        return;
      }

      // Auto sign-in and redirect to onboarding
      const signInResult = await signIn("credentials", {
        email: invitation?.email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setPageState("success");
        return;
      }

      router.push("/makler/onboarding/profile");
    } catch {
      setError("Doslo k neocekavane chybe. Zkuste to znovu.");
      setPageState("form");
    }
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
            <p className="text-sm text-gray-500">Overuji pozvanku...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token
  if (pageState === "invalid") {
    return (
      <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-50">
              <svg className="h-8 w-8 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Neplatna pozvanka</h2>
            <p className="mt-3 text-sm text-gray-500">{invalidMessage}</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
            >
              Zpet na uvod
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state (fallback if auto sign-in fails)
  if (pageState === "success") {
    return (
      <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
              <svg className="h-8 w-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Registrace uspesna!</h2>
            <p className="mt-3 text-sm text-gray-500">
              Vas ucet byl vytvoren. Prihlaste se a dokoncete onboarding.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
            >
              Prihlasit se
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Registrace maklere</h1>
            <p className="mt-2 text-sm text-gray-500">
              Dokoncete registraci a zacnete s onboardingem
            </p>
          </div>

          {error && (
            <Alert variant="error" className="mb-6">
              <p className="text-sm">{error}</p>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email - readonly */}
            <Input
              label="Email"
              type="email"
              value={invitation?.email || ""}
              readOnly
              className="!bg-gray-100 !cursor-not-allowed"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Jmeno"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (fieldErrors.firstName) setFieldErrors((p) => { const n = { ...p }; delete n.firstName; return n; });
                }}
                placeholder="Jan"
                error={fieldErrors.firstName}
              />
              <Input
                label="Prijmeni"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (fieldErrors.lastName) setFieldErrors((p) => { const n = { ...p }; delete n.lastName; return n; });
                }}
                placeholder="Novak"
                error={fieldErrors.lastName}
              />
            </div>

            <Input
              label="Telefon"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) setFieldErrors((p) => { const n = { ...p }; delete n.phone; return n; });
              }}
              placeholder="+420 123 456 789"
              error={fieldErrors.phone}
            />

            {/* IČO with ARES validation */}
            <div>
              <Input
                label="ICO"
                value={ico}
                onChange={(e) => {
                  setIco(e.target.value);
                  if (fieldErrors.ico) setFieldErrors((p) => { const n = { ...p }; delete n.ico; return n; });
                  if (e.target.value.replace(/\s/g, "").length === 8) {
                    validateIco(e.target.value);
                  } else {
                    setIcoStatus("idle");
                    setIcoCompany("");
                  }
                }}
                placeholder="12345678"
                error={fieldErrors.ico}
              />
              {icoStatus === "loading" && (
                <p className="mt-1 text-xs text-gray-400">Overuji v ARES...</p>
              )}
              {icoStatus === "valid" && icoCompany && (
                <p className="mt-1 text-xs text-success-600">{icoCompany}</p>
              )}
              {icoStatus === "invalid" && (
                <p className="mt-1 text-xs text-error-500">ICO nebylo nalezeno v ARES</p>
              )}
            </div>

            <Input
              label="Heslo"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((p) => { const n = { ...p }; delete n.password; return n; });
              }}
              placeholder="Minimalne 8 znaku"
              error={fieldErrors.password}
            />

            <Input
              label="Potvrzeni hesla"
              type="password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                if (fieldErrors.passwordConfirm) setFieldErrors((p) => { const n = { ...p }; delete n.passwordConfirm; return n; });
              }}
              placeholder="Zopakujte heslo"
              error={fieldErrors.passwordConfirm}
            />

            <div>
              <Checkbox
                label="Souhlasim s podminkami spoluprace a zpracovanim osobnich udaju"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (fieldErrors.consent) setFieldErrors((p) => { const n = { ...p }; delete n.consent; return n; });
                }}
              />
              {fieldErrors.consent && (
                <p className="mt-1 text-xs text-error-500">{fieldErrors.consent}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={pageState === "submitting"}
              className="w-full"
            >
              {pageState === "submitting" ? "Registruji..." : "Dokoncit registraci"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

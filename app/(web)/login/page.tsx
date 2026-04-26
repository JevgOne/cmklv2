"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getRedirectByRole } from "@/lib/auth-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleResendVerification = async () => {
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResendSent(true);
      }
    } catch {
      // Ignorovat chyby
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Nesprávný email nebo heslo");
        setLoading(false);
        return;
      }

      // Získání session pro určení role
      const res = await fetch("/api/auth/session");
      const session = await res.json();

      // Zkontrolovat ověření emailu (soft enforcement)
      if (session?.user && !session.user.isEmailVerified) {
        setEmailNotVerified(true);
        // Nepřerušovat login — pokračovat na dashboard
      }

      // callbackUrl from middleware redirect takes priority, otherwise role-based
      const callbackUrl = searchParams.get("callbackUrl");
      const role = session?.user?.role;
      router.push(callbackUrl || getRedirectByRole(role));
    } catch {
      setError("Došlo k neočekávané chybě. Zkuste to prosím znovu.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Přihlášení</h1>
        <p className="mt-2 text-sm text-gray-500">
          Přihlaste se do svého účtu CarMakléř
        </p>
      </div>

      {emailNotVerified && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm text-gray-700 font-medium">
            Váš email ještě nebyl ověřen. Zkontrolujte svou schránku.
          </p>
          {resendSent ? (
            <p className="text-sm text-green-600 mt-1">
              Ověřovací email odeslán!
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResendVerification}
              className="text-sm text-orange-600 hover:text-orange-700 underline mt-1"
            >
              Odeslat ověřovací email znovu
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vas@email.cz"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Heslo
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Vaše heslo"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Link
            href="/zapomenute-heslo"
            className="text-sm text-orange-600 hover:text-orange-700 no-underline"
          >
            Zapomenuté heslo?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-orange-500 px-4 py-3 text-base sm:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
        >
          {loading ? "Přihlašování..." : "Přihlásit se"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Nemáte účet?{" "}
          <Link
            href="/registrace"
            className="font-medium text-orange-600 hover:text-orange-700"
          >
            Registrujte se
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-gray-100" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

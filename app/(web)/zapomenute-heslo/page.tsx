"use client";

import { useState } from "react";
import Link from "next/link";

export default function ZapomenuteHesloPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        setError("Došlo k chybě. Zkuste to prosím znovu.");
      }
    } catch {
      setError("Došlo k chybě. Zkuste to prosím znovu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Zapomenuté heslo</h1>
            <p className="mt-2 text-sm text-gray-500">
              Zadejte svůj email a pošleme vám odkaz pro obnovu hesla
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-green-600"
                >
                  <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                  <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Zkontrolujte svůj email</h2>
              <p className="text-sm text-gray-500 mb-6">
                Pokud účet s tímto emailem existuje, odeslali jsme odkaz pro obnovu hesla.
                Zkontrolujte i složku spam.
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-orange-600 hover:text-orange-700 no-underline"
              >
                Zpět na přihlášení
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-orange-500 px-4 py-3 text-base sm:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
                >
                  {loading ? "Odesílám..." : "Odeslat odkaz"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 no-underline"
                >
                  Zpět na přihlášení
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

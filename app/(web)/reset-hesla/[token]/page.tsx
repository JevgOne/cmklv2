"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetHeslaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Heslo musí mít alespoň 8 znaků");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Hesla se neshodují");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Došlo k chybě. Zkuste to prosím znovu.");
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
            <h1 className="text-2xl font-bold text-gray-900">Nové heslo</h1>
            <p className="mt-2 text-sm text-gray-500">
              Zadejte své nové heslo
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-green-600"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Heslo změněno</h2>
              <p className="text-sm text-gray-500 mb-6">
                Vaše heslo bylo úspěšně změněno. Za moment budete přesměrováni na přihlášení.
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-orange-600 hover:text-orange-700 no-underline"
              >
                Přejít na přihlášení
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                  {error.includes("vyprsel") && (
                    <Link
                      href="/zapomenute-heslo"
                      className="block mt-2 font-medium text-orange-600 hover:text-orange-700 no-underline"
                    >
                      Zadat novou žádost
                    </Link>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Nové heslo
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimálně 8 znaků"
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="passwordConfirm"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Potvrzení hesla
                  </label>
                  <input
                    id="passwordConfirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Zadejte heslo znovu"
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-orange-500 px-4 py-3 text-base sm:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
                >
                  {loading ? "Měním heslo..." : "Změnit heslo"}
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

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      if (
        session?.user?.role === "ADMIN" ||
        session?.user?.role === "BACKOFFICE"
      ) {
        router.push("/admin/dashboard");
      } else {
        router.push("/makler/dashboard");
      }
    } catch {
      setError("Došlo k neočekávané chybě. Zkuste to prosím znovu.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Přihlášení</h1>
            <p className="mt-2 text-sm text-gray-500">
              Přihlaste se do svého účtu CarMakléř
            </p>
          </div>

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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Vaše heslo"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end">
              <a
                href="mailto:info@carmakler.cz?subject=Obnova%20hesla"
                className="text-sm text-orange-600 hover:text-orange-700 no-underline"
              >
                Zapomenuté heslo?
              </a>
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
      </div>
    </div>
  );
}

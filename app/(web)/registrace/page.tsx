"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegistracePage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
    role: "ADVERTISER" as "BROKER" | "ADVERTISER" | "BUYER",
    accountType: "PRIVATE" as "PRIVATE" | "DEALER" | "BAZAAR",
    companyName: "",
    ico: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "Jméno je povinné";
    }
    if (!formData.lastName.trim()) {
      errors.lastName = "Příjmení je povinné";
    }
    if (!formData.email.trim()) {
      errors.email = "Email je povinný";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Neplatný formát emailu";
    }
    if (formData.password.length < 8) {
      errors.password = "Heslo musí mít alespoň 8 znaků";
    }
    if (formData.password !== formData.passwordConfirm) {
      errors.passwordConfirm = "Hesla se neshodují";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Vymazat chybu pole při psaní
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          role: formData.role,
          accountType: formData.role === "ADVERTISER" ? formData.accountType : undefined,
          companyName: formData.role === "ADVERTISER" && formData.accountType !== "PRIVATE" ? formData.companyName || undefined : undefined,
          ico: formData.role === "ADVERTISER" && formData.accountType !== "PRIVATE" ? formData.ico || undefined : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError("Uživatel s tímto emailem již existuje");
        } else if (data.details) {
          setError(
            data.details.map((d: { message: string }) => d.message).join(", ")
          );
        } else {
          setError(data.error || "Registrace se nezdařila");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Došlo k neočekávané chybě. Zkuste to prosím znovu.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
              <svg
                className="h-8 w-8 text-success-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Registrace úspěšná!
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              {formData.role === "BROKER"
                ? "Váš účet čeká na schválení. Po aktivaci vás budeme informovat emailem."
                : "Váš účet je aktivní. Můžete se přihlásit."}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
            >
              Přejít na přihlášení
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Registrace
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Vytvořte si účet na CarMakléř
            </p>
          </div>

          {/* Výběr typu účtu */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Typ účtu
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "BUYER", label: "Kupující" },
                { value: "ADVERTISER", label: "Prodávající" },
                { value: "BROKER", label: "Makléř" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: option.value }))}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    formData.role === option.value
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Typ prodejce (pokud ADVERTISER) */}
          {formData.role === "ADVERTISER" && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Typ prodejce
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "PRIVATE", label: "Soukromý" },
                  { value: "BAZAAR", label: "Autobazar" },
                  { value: "DEALER", label: "Dealer" },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, accountType: option.value }))}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                      formData.accountType === option.value
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Jméno
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Jan"
                  className={`w-full rounded-lg border px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none ${
                    fieldErrors.firstName ? "border-error-500" : "border-gray-300"
                  }`}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs text-error-500">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Příjmení
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Novák"
                  className={`w-full rounded-lg border px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none ${
                    fieldErrors.lastName ? "border-error-500" : "border-gray-300"
                  }`}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs text-error-500">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vas@email.cz"
                className={`w-full rounded-lg border px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none ${
                  fieldErrors.email ? "border-error-500" : "border-gray-300"
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-error-500">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Telefon{" "}
                <span className="font-normal text-gray-400">(nepovinné)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+420 123 456 789"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
              />
            </div>

            {/* Firemní údaje pro autobazar/dealer */}
            {formData.role === "ADVERTISER" && formData.accountType !== "PRIVATE" && (
              <>
                <div>
                  <label
                    htmlFor="companyName"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Název firmy
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="AutoBazar s.r.o."
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ico"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    IČO
                  </label>
                  <input
                    id="ico"
                    name="ico"
                    type="text"
                    value={formData.ico}
                    onChange={handleChange}
                    placeholder="12345678"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Heslo
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimálně 8 znaků"
                className={`w-full rounded-lg border px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none ${
                  fieldErrors.password ? "border-error-500" : "border-gray-300"
                }`}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-error-500">
                  {fieldErrors.password}
                </p>
              )}
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
                name="passwordConfirm"
                type="password"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="Zopakujte heslo"
                className={`w-full rounded-lg border px-4 py-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none ${
                  fieldErrors.passwordConfirm
                    ? "border-error-500"
                    : "border-gray-300"
                }`}
              />
              {fieldErrors.passwordConfirm && (
                <p className="mt-1 text-xs text-error-500">
                  {fieldErrors.passwordConfirm}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-500 px-4 py-3 text-base sm:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
            >
              {loading ? "Registrace..." : "Registrovat se"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Máte účet?{" "}
              <Link
                href="/login"
                className="font-medium text-orange-600 hover:text-orange-700"
              >
                Přihlásit se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

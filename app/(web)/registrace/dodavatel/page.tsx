import type { Metadata } from "next";
import { Suspense } from "react";
import { SupplierRegistrationForm } from "@/components/web/SupplierRegistrationForm";

export const metadata: Metadata = {
  title: "Registrace dodavatele dílů",
  description: "Přidávejte díly z vašeho vrakoviště přes jednoduchou mobilní aplikaci CarMakléř",
};

export default function DodavatelRegistracePage() {
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
        <Suspense fallback={
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card space-y-6">
            <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-[44px] bg-orange-200 rounded-lg animate-pulse" />
          </div>
        }>
          <SupplierRegistrationForm />
        </Suspense>
      </div>
    </div>
  );
}

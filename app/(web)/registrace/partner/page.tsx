import type { Metadata } from "next";
import { Suspense } from "react";
import { PartnerRegistrationForm } from "@/components/web/PartnerRegistrationForm";

export const metadata: Metadata = {
  title: "Registrace partnera",
  description: "Zaregistrujte svůj autobazar nebo vrakoviště a začněte spolupracovat s CarMakléř",
};

export default function PartnerRegistracePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <span className="inline-block bg-orange-100 text-orange-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Partnerský program
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Registrace partnera
          </h1>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Zaregistrujte svůj autobazar nebo vrakoviště a začněte spolupracovat s CarMakléř.
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
          <PartnerRegistrationForm />
        </Suspense>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { BrokerRegistrationForm } from "@/components/web/BrokerRegistrationForm";

export const metadata: Metadata = {
  title: "Registrace makléře",
  description: "Dokončete registraci makléře CarMakléř a začněte s onboardingem",
};

export default function BrokerRegistrationPage() {
  return (
    <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
            <p className="text-sm text-gray-500">Ověřuji pozvánku...</p>
          </div>
        }>
          <BrokerRegistrationForm />
        </Suspense>
      </div>
    </div>
  );
}

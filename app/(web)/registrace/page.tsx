import type { Metadata } from "next";
import { Suspense } from "react";
import { RegistrationForm } from "@/components/web/RegistrationForm";

export const metadata: Metadata = {
  title: "Registrace",
  description: "Vytvořte si účet na CarMakléř — kupující i prodávající",
};

export default function RegistracePage() {
  return (
    <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
            <div className="mb-8 text-center">
              <div className="h-8 w-32 bg-gray-100 rounded animate-pulse mx-auto" />
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mx-auto mt-3" />
            </div>
            <div className="space-y-5">
              <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[44px] bg-orange-200 rounded-lg animate-pulse" />
            </div>
          </div>
        }>
          <RegistrationForm />
        </Suspense>
      </div>
    </div>
  );
}

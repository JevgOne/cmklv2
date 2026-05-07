import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/web/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Zapomenuté heslo",
  description: "Obnovte heslo ke svému účtu CarMakléř",
};

export default function ZapomenuteHesloPage() {
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
          <Suspense fallback={
            <div className="space-y-5">
              <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[44px] bg-orange-200 rounded-lg animate-pulse" />
            </div>
          }>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

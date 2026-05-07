import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/web/LoginForm";

export const metadata: Metadata = {
  title: "Přihlášení",
  description: "Přihlaste se do svého účtu CarMakléř",
};

export default function LoginPage() {
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
          <Suspense fallback={
            <div className="space-y-5">
              <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[44px] bg-orange-200 rounded-lg animate-pulse" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/web/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Nové heslo",
  description: "Nastavte si nové heslo ke svému účtu CarMakléř",
};

export default async function ResetHeslaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

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
          <Suspense fallback={
            <div className="space-y-5">
              <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[44px] bg-orange-200 rounded-lg animate-pulse" />
            </div>
          }>
            <ResetPasswordForm token={token} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

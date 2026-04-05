"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Neznámá chyba";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-red-500">!</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          Ověření se nezdařilo
        </h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href="/login"
          className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors no-underline"
        >
          Přejít na přihlášení
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <ErrorContent />
    </Suspense>
  );
}

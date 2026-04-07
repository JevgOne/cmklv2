"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Něco se pokazilo
        </h1>
        <p className="text-gray-500 mb-6">
          {error.message || "Stránka se nepodařila načíst. Zkuste to prosím znovu."}
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="py-3 px-6 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors"
          >
            Zkusit znovu
          </button>
          <Link
            href="/dily"
            className="inline-flex items-center py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-full no-underline hover:bg-gray-200 transition-colors"
          >
            Zpět na díly
          </Link>
        </div>
      </div>
    </main>
  );
}

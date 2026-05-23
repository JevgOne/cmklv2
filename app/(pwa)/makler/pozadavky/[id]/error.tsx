"use client";

export default function PozadavekDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-white px-4">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Požadavek nenalezen</h2>
      <p className="text-sm text-gray-500 mb-6 text-center">
        {error.message || "Požadavek neexistuje nebo k němu nemáte přístup."}
      </p>
      <div className="flex gap-3">
        <a
          href="/makler/pozadavky"
          className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors no-underline"
        >
          Zpět na seznam
        </a>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          Zkusit znovu
        </button>
      </div>
    </div>
  );
}

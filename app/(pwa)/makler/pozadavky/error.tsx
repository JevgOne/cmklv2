"use client";

export default function PozadavkyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-50 px-4">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Chyba při načítání požadavků</h2>
      <p className="text-sm text-gray-500 mb-6 text-center">
        {error.message || "Něco se pokazilo. Zkuste to znovu."}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
      >
        Zkusit znovu
      </button>
    </div>
  );
}

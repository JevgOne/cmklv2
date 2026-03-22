"use client";

export default function CompareError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Chyba porovnání
        </h1>
        <p className="text-gray-500 mb-4">
          Nepodařilo se načíst data pro porovnání vozidel.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer transition-all duration-200 py-2 px-6 text-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white"
        >
          Zkusit znovu
        </button>
      </div>
    </div>
  );
}

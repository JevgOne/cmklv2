"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4 text-center space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Chyba při načítání provizí</h2>
      <p className="text-sm text-gray-500">Zkuste to prosím znovu.</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold"
      >
        Zkusit znovu
      </button>
    </div>
  );
}

"use client";

export default function NotificationsError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="text-gray-500 mb-4">Nepodařilo se načíst notifikace.</p>
      <button
        type="button"
        onClick={reset}
        className="text-sm text-orange-500 font-medium hover:text-orange-600 cursor-pointer bg-transparent border-none"
      >
        Zkusit znovu
      </button>
    </div>
  );
}

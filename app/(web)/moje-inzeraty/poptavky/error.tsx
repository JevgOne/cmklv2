"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Něco se pokazilo</h2>
      <p className="text-sm text-gray-500 mb-4">Nepodařilo se načíst poptávky.</p>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition"
      >
        Zkusit znovu
      </button>
    </div>
  );
}

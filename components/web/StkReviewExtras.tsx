"use client";

interface StkReviewExtrasProps {
  ratingWaitTime: number | null;
  ratingFairness: number | null;
  passedInspection: boolean | null;
  onChange: (field: string, value: number | boolean | null) => void;
}

export function StkReviewExtras({
  ratingWaitTime,
  ratingFairness,
  passedInspection,
  onChange,
}: StkReviewExtrasProps) {
  return (
    <div className="border-t border-orange-200 pt-4 mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">STK hodnocení</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Čekací doba</label>
          <select
            value={ratingWaitTime ?? ""}
            onChange={(e) => onChange("ratingWaitTime", e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">Nehodnotit</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)} ({n === 5 ? "okamžitě" : n === 4 ? "krátká" : n === 3 ? "průměrná" : n === 2 ? "dlouhá" : "velmi dlouhá"})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Férovost posouzení</label>
          <select
            value={ratingFairness ?? ""}
            onChange={(e) => onChange("ratingFairness", e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">Nehodnotit</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)} ({n === 5 ? "velmi férové" : n === 4 ? "férové" : n === 3 ? "neutrální" : n === 2 ? "přísné" : "neférové"})
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Prošli jste STK?</label>
          <div className="flex gap-4">
            {([
              { value: true, label: "Ano, prošel/a" },
              { value: false, label: "Ne, neprošel/a" },
              { value: null, label: "Neuvádím" },
            ] as { value: boolean | null; label: string }[]).map((opt) => (
              <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="passedInspection"
                  checked={passedInspection === opt.value}
                  onChange={() => onChange("passedInspection", opt.value)}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

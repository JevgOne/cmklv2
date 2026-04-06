/**
 * ShopTrustBar — trust signals pro shop footer.
 * Zobrazuje platební metody (Visa, MC, Apple Pay, Google Pay) a
 * dopravce (Zásilkovna, DPD, PPL, GLS, Česká pošta).
 *
 * TODO(designer): Aktuálně text-badges jako placeholder. Nahradit
 * oficiálními brand SVG v `public/brand/payment-methods/` a
 * `public/brand/carriers/` — vyžaduje brand asset approval od značek.
 * Plán: task #28 sekce 2.5 + klíčové rozhodnutí 8.8.
 */

const paymentMethods = [
  { key: "visa", label: "Visa" },
  { key: "mastercard", label: "Mastercard" },
  { key: "apple-pay", label: "Apple Pay" },
  { key: "google-pay", label: "Google Pay" },
];

const carriers = [
  { key: "zasilkovna", label: "Zásilkovna" },
  { key: "dpd", label: "DPD" },
  { key: "ppl", label: "PPL" },
  { key: "gls", label: "GLS" },
  { key: "ceska-posta", label: "Česká pošta" },
];

function TrustBadge({ label }: { label: string }) {
  return (
    <div
      className="bg-white text-gray-900 rounded px-3 py-1.5 text-xs font-semibold shadow-sm"
      aria-label={label}
      title={label}
    >
      {label}
    </div>
  );
}

export function ShopTrustBar() {
  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
            Bezpečné platby
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {paymentMethods.map((pm) => (
              <TrustBadge key={pm.key} label={pm.label} />
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
            Dopravci
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {carriers.map((c) => (
              <TrustBadge key={c.key} label={c.label} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

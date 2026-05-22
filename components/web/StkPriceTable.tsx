import { Card } from "@/components/ui/Card";
import { STK_PRICES } from "@/lib/stk-pricing";

function formatPrice(n: number): string {
  return n.toLocaleString("cs-CZ");
}

export function StkPriceTable() {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 pb-0">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-1">
          Ceník STK 2026
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Regulované ceny dle vyhlášky č. 302/2001 Sb.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 font-medium text-gray-500">Kategorie</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Typ vozidla</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">STK</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Emise</th>
              <th className="text-right px-6 py-3 font-medium text-gray-500">Celkem</th>
            </tr>
          </thead>
          <tbody>
            {STK_PRICES.map((row) => (
              <tr
                key={row.category}
                className={`border-b border-gray-100 ${
                  row.category === "M1" ? "bg-orange-50/50" : ""
                }`}
              >
                <td className="px-6 py-2.5 font-mono text-xs text-gray-400">{row.category}</td>
                <td className="px-4 py-2.5 text-gray-700">{row.label}</td>
                <td className="px-4 py-2.5 text-right text-gray-900">{formatPrice(row.stk)} Kč</td>
                <td className="px-4 py-2.5 text-right text-gray-900">
                  {row.emise !== null ? `${formatPrice(row.emise)} Kč` : "—"}
                </td>
                <td className="px-6 py-2.5 text-right font-bold text-gray-900">{formatPrice(row.total)} Kč</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

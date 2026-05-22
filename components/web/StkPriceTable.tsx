import { Card } from "@/components/ui/Card";
import { STK_PRICES, STK_PRICE_GROUPS } from "@/lib/stk-pricing";
import type { StkPriceGroup } from "@/lib/stk-pricing";

function formatPrice(n: number): string {
  return n.toLocaleString("cs-CZ");
}

const GROUP_ORDER: StkPriceGroup[] = ["personal", "motorcycle", "commercial", "trailer"];

export function StkPriceTable() {
  return (
    <Card className="overflow-hidden">
      <div className="p-5 pb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-1">
          Ceník STK 2026
        </h2>
        <p className="text-xs text-gray-400">
          Regulované ceny dle vyhlášky č. 302/2001 Sb.
        </p>
      </div>

      <div className="px-5 pb-5 space-y-4">
        {GROUP_ORDER.map((groupKey) => {
          const group = STK_PRICE_GROUPS[groupKey];
          const rows = STK_PRICES.filter((r) => r.group === groupKey);

          return (
            <div key={groupKey}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{group.icon}</span>
                <span className="text-sm font-semibold text-gray-700">
                  {group.label}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100 overflow-hidden">
                {rows.map((row) => (
                  <div
                    key={row.category}
                    className={`px-4 py-3 ${
                      row.highlight
                        ? "bg-orange-50 border-l-4 border-orange-400"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-gray-900">
                          {row.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({row.category})
                        </span>
                        {row.highlight && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            Nejčastější
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-900 whitespace-nowrap ml-3">
                        {formatPrice(row.total)} Kč
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      STK {formatPrice(row.stk)} Kč
                      {row.emise !== null && (
                        <> · Emise {formatPrice(row.emise)} Kč</>
                      )}
                    </div>
                  </div>
                ))}

                {groupKey === "trailer" && (
                  <div className="px-4 py-2.5 bg-blue-50 text-xs text-blue-700 italic">
                    Přívěsy nepodléhají emisní kontrole — u přívěsů se platí pouze STK.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

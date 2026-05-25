import { Card } from "@/components/ui/Card";
import { STK_PRICES, STK_PRICE_GROUPS } from "@/lib/stk-pricing";
import type { StkPriceGroup } from "@/lib/stk-pricing";

function formatPrice(n: number): string {
  return n.toLocaleString("cs-CZ");
}

const GROUP_ORDER: StkPriceGroup[] = ["personal", "motorcycle", "commercial", "trailer"];

export function StkPriceTable() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        🚗 Ceník STK prohlídek
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Ceny regulované státem (vyhl. 302/2001 Sb.)
      </p>

      <div className="space-y-6">
        {GROUP_ORDER.map((groupKey) => {
          const group = STK_PRICE_GROUPS[groupKey];
          const rows = STK_PRICES.filter((r) => r.group === groupKey);

          return (
            <div key={groupKey}>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>{group.icon}</span>
                <span>{group.label}</span>
              </h4>

              <div className="space-y-2">
                {rows.map((row) => (
                  <div
                    key={row.category}
                    className={`rounded-xl p-3 flex justify-between items-center ${
                      row.highlight
                        ? "bg-orange-50 border border-orange-200"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-medium text-gray-900 text-sm">
                        {row.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({row.category})
                      </span>
                      {row.highlight && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ml-1">
                          Nejčastější
                        </span>
                      )}
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <span className={`font-bold text-sm ${row.highlight ? "text-orange-600" : "text-gray-900"}`}>
                        {formatPrice(row.total)} Kč
                      </span>
                      <div className="text-[10px] text-gray-400">
                        STK {formatPrice(row.stk)}
                        {row.emise !== null && ` + emise ${formatPrice(row.emise)}`}
                      </div>
                    </div>
                  </div>
                ))}

                {groupKey === "trailer" && (
                  <div className="rounded-xl px-3 py-2.5 bg-blue-50 text-xs text-blue-700 italic border border-blue-100">
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

import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProductDetailTabsProps {
  description: string | null;
  compatibleBrands: string[];
  compatibleModels: string[];
  yearFrom: number | null;
  yearTo: number | null;
  universalFit: boolean;
  weight: number | null;
  dimensions: string | null;
  activeTab?: string;
  slug: string;
}

const tabList = [
  { value: "popis", label: "Popis" },
  { value: "kompatibilita", label: "Kompatibilita" },
  { value: "zaruka", label: "Záruka" },
];

export function ProductDetailTabs({
  description,
  compatibleBrands,
  compatibleModels,
  yearFrom,
  yearTo,
  universalFit,
  weight,
  dimensions,
  activeTab = "popis",
  slug,
}: ProductDetailTabsProps) {
  const active = tabList.some((t) => t.value === activeTab) ? activeTab : "popis";

  return (
    <div>
      {/* Tab buttons — Link-based SSR */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
        {tabList.map((tab) => {
          const isActive = active === tab.value;
          return (
            <Link
              key={tab.value}
              href={`/shop/produkt/${slug}?tab=${tab.value}`}
              replace
              scroll={false}
              className={cn(
                "px-4 sm:px-5 py-2.5 text-sm font-semibold text-gray-600 rounded-[10px] transition-all duration-200 hover:text-gray-900 whitespace-nowrap min-h-[44px] flex items-center no-underline",
                isActive && "bg-white text-gray-900 shadow-sm",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="mt-6 bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
        {active === "popis" && (
          <div className="prose prose-gray max-w-none">
            <h3 className="text-lg font-bold text-gray-900">Popis dílu</h3>
            {description ? (
              <p className="text-gray-600 leading-relaxed mt-3">
                {description}
              </p>
            ) : (
              <p className="text-gray-500 mt-3">
                Popis není k dispozici.
              </p>
            )}
            {(weight || dimensions) && (
              <>
                <h4 className="text-base font-bold text-gray-900 mt-6">
                  Rozměry a hmotnost:
                </h4>
                <p className="text-gray-600 mt-2">
                  {weight ? `Hmotnost: ${weight} kg` : ""}
                  {weight && dimensions ? " | " : ""}
                  {dimensions ? `Rozměry: ${dimensions}` : ""}
                </p>
              </>
            )}
          </div>
        )}

        {active === "kompatibilita" && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Kompatibilní vozy
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Ověřte, zda díl pasuje do vašeho vozu. V případě pochybností nás
              kontaktujte s VIN kódem.
            </p>

            {universalFit ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                <span className="text-lg">✅</span>
                <span className="font-medium text-green-700">
                  Univerzální díl — pasuje na většinu vozů
                </span>
              </div>
            ) : compatibleBrands.length > 0 ? (
              <div className="space-y-3">
                {compatibleBrands.map((brand, idx) => (
                  <div
                    key={brand}
                    className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200"
                  >
                    <span className="text-lg">✅</span>
                    <span className="font-medium text-green-700">
                      {brand}
                      {compatibleModels[idx] ? ` ${compatibleModels[idx]}` : ""}
                      {yearFrom && yearTo ? ` ${yearFrom}-${yearTo}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                Informace o kompatibilitě nejsou k dispozici.
              </p>
            )}
          </div>
        )}

        {active === "zaruka" && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Záruční podmínky
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl shrink-0">
                  🔄
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    14 dní na vrácení
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Do 14 dní od převzetí můžete díl vrátit bez udání důvodu.
                    Díl musí být ve stejném stavu, v jakém jste jej obdrželi.
                    Vrácení peněz do 5 pracovních dní.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl shrink-0">
                  🛡️
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    6 měsíců záruka na funkčnost
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Na všechny použité díly poskytujeme záruku 6 měsíců na plnou
                    funkčnost. Záruka se nevztahuje na kosmetické vady uvedené v
                    popisu produktu a na opotřebení odpovídající stáří dílu.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl shrink-0">
                  📋
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Reklamace</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    V případě nefunkčnosti dílu vám nabídneme výměnu za jiný
                    dostupný kus, nebo vrácení plné ceny. Reklamaci vyřizujeme
                    do 5 pracovních dní. Kontaktujte nás na{" "}
                    <span className="font-semibold text-orange-500">
                      reklamace@carmakler.cz
                    </span>{" "}
                    nebo telefonicky.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Tab data                                                           */
/* ------------------------------------------------------------------ */

const tabList = [
  { value: "popis", label: "Popis" },
  { value: "kompatibilita", label: "Kompatibilita" },
  { value: "zaruka", label: "Záruka" },
];

const compatibleVehicles = [
  { name: "Škoda Octavia III (5E) 2013-2020", status: "ok" as const },
  { name: "Škoda Octavia III Combi (5E) 2013-2020", status: "ok" as const },
  { name: "Škoda Octavia IV (NX) 2020+", status: "no" as const },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProductDetailTabs() {
  const [active, setActive] = useState("popis");

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-fit overflow-x-auto">
        {tabList.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={cn(
              "px-4 sm:px-5 py-2.5 bg-transparent text-sm font-semibold text-gray-600 rounded-[10px] cursor-pointer transition-all duration-200 hover:text-gray-900 border-none whitespace-nowrap min-h-[44px] flex items-center",
              active === tab.value && "bg-white text-gray-900 shadow-sm",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6 bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
        {active === "popis" && (
          <div className="prose prose-gray max-w-none">
            <h3 className="text-lg font-bold text-gray-900">
              Dveře přední levé — Škoda Octavia III
            </h3>
            <p className="text-gray-600 leading-relaxed mt-3">
              Originální přední levé dveře ze Škody Octavia III generace (5E),
              rok výroby 2019. Díl pochází z vozu s nájezdem 85 000 km, který
              byl vyřazen z provozu kvůli nárazu do zadní části — přední díly
              včetně těchto dveří zůstaly nepoškozené.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Dveře jsou v originální bílé barvě Candy (kód LS9R), kompletní
              včetně skla, vnitřního obložení, madla, elektrického stahování
              oken a zámku. Mechanismus otevírání a zavírání je plně funkční.
              Na spodní hraně jsou drobné oděrky z běžného provozu (viditelné na
              fotografii č. 3).
            </p>
            <h4 className="text-base font-bold text-gray-900 mt-6">
              Co je v balení:
            </h4>
            <ul className="text-gray-600 space-y-1 mt-2">
              <li>Dveře komplet s obložením</li>
              <li>Originální sklo s ovládáním</li>
              <li>Vnější madlo a zámek</li>
              <li>Vnitřní obložení dveří</li>
              <li>Kabelový svazek</li>
            </ul>
            <h4 className="text-base font-bold text-gray-900 mt-6">
              Rozměry a hmotnost:
            </h4>
            <p className="text-gray-600 mt-2">
              Hmotnost cca 22 kg. Doporučujeme přepravu na paletě nebo osobní
              odběr. Při přepravě kurýrní službou je díl pojištěn proti
              poškození.
            </p>
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
            <div className="space-y-3">
              {compatibleVehicles.map((v) => (
                <div
                  key={v.name}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl",
                    v.status === "ok"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200",
                  )}
                >
                  <span className="text-lg">
                    {v.status === "ok" ? "✅" : "⚠️"}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      v.status === "ok" ? "text-green-700" : "text-red-700",
                    )}
                  >
                    {v.name}
                  </span>
                  {v.status === "no" && (
                    <span className="ml-auto text-xs font-bold text-red-500 uppercase">
                      Nehodí se
                    </span>
                  )}
                </div>
              ))}
            </div>
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

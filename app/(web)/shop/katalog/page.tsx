"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { ProductCard } from "@/components/web/ProductCard";
import type { ProductCardProps } from "@/components/web/ProductCard";

/* ------------------------------------------------------------------ */
/*  Dummy data                                                         */
/* ------------------------------------------------------------------ */

const allProducts: (ProductCardProps & { tab: string })[] = [
  {
    name: "Dveře přední levé",
    compatibility: "Škoda Octavia III 2013-2020",
    condition: 4,
    price: 4500,
    badge: "used",
    slug: "dvere-predni-leve-octavia-iii",
    tab: "vraky",
  },
  {
    name: "Motor 2.0 TDI DFGA komplet",
    compatibility: "Škoda Octavia III",
    condition: 5,
    price: 45000,
    badge: "used",
    slug: "motor-2-0-tdi-dfga",
    tab: "vraky",
  },
  {
    name: "Turbodmychadlo",
    compatibility: "2.0 TDI VW Group",
    condition: 4,
    price: 12000,
    badge: "used",
    slug: "turbodmychadlo-2-0-tdi",
    tab: "vraky",
  },
  {
    name: "Koch Chemie GSF 1L",
    compatibility: "Autošampon",
    price: 299,
    oldPrice: 399,
    badge: "sale",
    slug: "koch-chemie-gsf-1l",
    tab: "kosmetika",
  },
  {
    name: "Brzdové destičky přední",
    compatibility: "VW Group",
    price: 890,
    badge: "new",
    slug: "brzdove-desticky-vw-group",
    tab: "aftermarket",
  },
  {
    name: "LED světlomet přední pravý",
    compatibility: "BMW F30 2012-2018",
    condition: 4,
    price: 8500,
    badge: "used",
    slug: "led-svetlomet-bmw-f30",
    tab: "vraky",
  },
  {
    name: "Mikrovláknové utěrky 5ks",
    compatibility: "Univerzální",
    price: 199,
    badge: "new",
    slug: "mikrovlaknove-uterky-5ks",
    tab: "doplnky",
  },
  {
    name: "Sedačka řidiče komplet",
    compatibility: "Škoda Octavia RS 2017-2020",
    condition: 3,
    price: 6200,
    badge: "used",
    slug: "sedacka-ridice-octavia-rs",
    tab: "vraky",
  },
  {
    name: "Olejový filtr Mann",
    compatibility: "2.0 TDI",
    price: 189,
    badge: "new",
    slug: "olejovy-filtr-mann-2-0-tdi",
    tab: "aftermarket",
  },
];

const tabs = [
  { value: "vse", label: "Vše" },
  { value: "vraky", label: "Díly z vraků" },
  { value: "aftermarket", label: "Aftermarket" },
  { value: "kosmetika", label: "Autokosmetika" },
  { value: "doplnky", label: "Doplňky" },
];

const brandOptions = [
  { value: "skoda", label: "Škoda" },
  { value: "vw", label: "Volkswagen" },
  { value: "bmw", label: "BMW" },
  { value: "audi", label: "Audi" },
  { value: "mercedes", label: "Mercedes-Benz" },
  { value: "hyundai", label: "Hyundai" },
  { value: "toyota", label: "Toyota" },
  { value: "ford", label: "Ford" },
];

const categoryOptions = [
  { value: "karoserie", label: "Karoserie" },
  { value: "motor", label: "Motor" },
  { value: "podvozek", label: "Podvozek" },
  { value: "elektro", label: "Elektro" },
  { value: "skla", label: "Skla" },
  { value: "interier", label: "Interiér" },
  { value: "kosmetika", label: "Autokosmetika" },
  { value: "servisni", label: "Servisní díly" },
];

const conditionOptions = [
  { value: "vse", label: "Vše" },
  { value: "nove", label: "Nové" },
  { value: "pouzite", label: "Použité" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function KatalogPage() {
  const [activeTab, setActiveTab] = useState("vse");
  const [skladem, setSkladem] = useState(false);

  const filteredProducts =
    activeTab === "vse"
      ? allProducts
      : allProducts.filter((p) => p.tab === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ============================================================ */}
      {/* Header                                                        */}
      {/* ============================================================ */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Katalog dílů a příslušenství
          </h1>
          <p className="text-gray-500 mt-2">
            <span className="font-bold text-orange-500">
              {filteredProducts.length}
            </span>{" "}
            produktů v nabídce
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Tabs + Filters + Grid                                         */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(val) => setActiveTab(val)}
          />
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-end">
            <Select
              label="Značka vozu"
              placeholder="Všechny značky"
              options={brandOptions}
            />
            <Select
              label="Kategorie"
              placeholder="Všechny kategorie"
              options={categoryOptions}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Cena od" placeholder="0" type="number" />
              <Input label="Cena do" placeholder="50 000" type="number" />
            </div>
            <Select
              label="Stav"
              placeholder="Vše"
              options={conditionOptions}
            />
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
                Dostupnost
              </span>
              <label className="flex items-center gap-2 cursor-pointer py-3">
                <input
                  type="checkbox"
                  checked={skladem}
                  onChange={(e) => setSkladem(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-[15px] font-medium text-gray-700">
                  Pouze skladem
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.slug}
              name={product.name}
              compatibility={product.compatibility}
              condition={product.condition}
              price={product.price}
              oldPrice={product.oldPrice}
              badge={product.badge}
              slug={product.slug}
            />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-12">
          <Button variant="ghost" size="sm" disabled>
            &larr; Předchozí
          </Button>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white font-bold text-sm">
            1
          </span>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors">
            2
          </span>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors">
            3
          </span>
          <span className="text-gray-400 px-1">...</span>
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm cursor-pointer hover:bg-gray-200 transition-colors">
            12
          </span>
          <Button variant="ghost" size="sm">
            Další &rarr;
          </Button>
        </div>
      </div>
    </div>
  );
}

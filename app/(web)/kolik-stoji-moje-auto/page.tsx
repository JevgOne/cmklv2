"use client";

import { useState } from "react";
import Link from "next/link";
import { FaqSection } from "@/components/web/FaqSection";
import { BRANDS } from "@/lib/seo-data";

const faqItems = [
  {
    question: "Jak přesná je online kalkulačka ceny?",
    answer: "Online kalkulačka poskytuje orientační cenové rozpětí na základě statistik trhu. Pro přesné ocenění doporučujeme kontaktovat certifikovaného makléře CarMakler, který zohlední konkrétní stav a výbavu vozu.",
  },
  {
    question: "Kolik stojí profesionální ocenění auta?",
    answer: "Ocenění vozu certifikovaným makléřem CarMakler je zcela zdarma a nezávazné. Makléř přijede k vám, prohlédne auto a sdělí reálnou tržní cenu.",
  },
  {
    question: "Co ovlivňuje cenu ojetého auta nejvíce?",
    answer: "Hlavní faktory: značka a model, rok výroby, nájezd kilometrů, celkový stav (exteriér, interiér, motor), servisní historie, výbava a aktuální tržní poptávka.",
  },
  {
    question: "Jak rychle mohu auto prodat?",
    answer: "S makléřem CarMakler je průměrná doba prodeje 1-3 týdny. Při správně nastavené ceně a kvalitní prezentaci může být prodej ještě rychlejší.",
  },
];

const fuelTypes = [
  { value: "benzin", label: "Benzín" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "elektro", label: "Elektro" },
  { value: "lpg", label: "LPG/CNG" },
];

const conditions = [
  { value: "excellent", label: "Výborný", multiplier: 1.1 },
  { value: "good", label: "Dobrý", multiplier: 1.0 },
  { value: "fair", label: "Uspokojivý", multiplier: 0.85 },
  { value: "poor", label: "Špatný", multiplier: 0.65 },
];

function estimatePrice(year: number, km: number, conditionMultiplier: number): { min: number; max: number } {
  const currentYear = 2026;
  const age = currentYear - year;
  const basePrice = 500000;
  const ageDepreciation = Math.pow(0.88, age);
  const kmDepreciation = Math.max(0.3, 1 - km / 500000);
  const estimated = basePrice * ageDepreciation * kmDepreciation * conditionMultiplier;
  const min = Math.round(estimated * 0.8 / 5000) * 5000;
  const max = Math.round(estimated * 1.2 / 5000) * 5000;
  return { min: Math.max(min, 20000), max: Math.max(max, 40000) };
}

export default function KolikStojiMojeAutoPage() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [km, setKm] = useState("");
  const [condition, setCondition] = useState("");
  const [fuel, setFuel] = useState("");
  const [result, setResult] = useState<{ min: number; max: number } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!year || !km || !condition) return;

    const condData = conditions.find((c) => c.value === condition);
    const multiplier = condData?.multiplier || 1;
    const price = estimatePrice(parseInt(year), parseInt(km), multiplier);
    setResult(price);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const selectedBrand = BRANDS.find((b) => b.slug === brand);

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Kalkulačka ceny vozidla",
            description: "Zjistěte orientační cenu vašeho ojetého auta online",
            url: "https://www.carmakler.cz/kolik-stoji-moje-auto",
            applicationCategory: "FinanceApplication",
            operatingSystem: "All",
            offers: { "@type": "Offer", price: "0", priceCurrency: "CZK" },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Domů", item: "https://www.carmakler.cz" },
              { "@type": "ListItem", position: 2, name: "Kolik stojí moje auto", item: "https://www.carmakler.cz/kolik-stoji-moje-auto" },
            ],
          }),
        }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-1.5 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-orange-500 transition-colors no-underline text-gray-500">Domů</Link></li>
            <li className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              <span className="text-gray-900 font-medium">Kolik stojí moje auto</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900">
            Kolik stojí moje auto?
          </h1>
          <p className="text-lg text-gray-500 mt-3 max-w-2xl">
            Zjistěte orientační cenu vašeho vozidla během minuty. Vyplňte základní údaje a získejte cenové rozpětí.
          </p>
        </div>
      </section>

      {/* Calculator form */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Údaje o vozidle</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Značka</label>
              <select
                value={brand}
                onChange={(e) => { setBrand(e.target.value); setModel(""); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Vyberte značku</option>
                {BRANDS.map((b) => (
                  <option key={b.slug} value={b.slug}>{b.displayName}</option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={!brand}
              >
                <option value="">Vyberte model</option>
                {selectedBrand?.topModels.map((m) => (
                  <option key={m.slug} value={m.slug}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rok výroby *</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">Vyberte rok</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Km */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nájezd (km) *</label>
              <input
                type="number"
                value={km}
                onChange={(e) => setKm(e.target.value)}
                placeholder="např. 120000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min={0}
                max={999999}
                required
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stav vozidla *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">Vyberte stav</option>
                {conditions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Fuel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Palivo</label>
              <select
                value={fuel}
                onChange={(e) => setFuel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Vyberte palivo</option>
                {fuelTypes.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold rounded-full shadow-orange hover:-translate-y-0.5 hover:shadow-orange-hover transition-all duration-200 border-none cursor-pointer text-[15px]"
          >
            Zjistit cenu
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Orientační cena vašeho vozidla
            </h3>
            <div className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-1">
              {new Intl.NumberFormat("cs-CZ").format(result.min)} — {new Intl.NumberFormat("cs-CZ").format(result.max)} Kč
            </div>
            <p className="text-sm text-gray-500 mb-6">
              * Orientační rozpětí na základě statistik trhu. Přesnou cenu stanoví makléř po prohlídce.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/chci-prodat"
                className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold rounded-full shadow-orange hover:-translate-y-0.5 transition-all duration-200 no-underline text-sm"
              >
                Chci přesné ocenění zdarma
              </Link>
              <Link
                href="/nabidka"
                className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-white text-gray-800 font-semibold rounded-full shadow-[inset_0_0_0_2px_var(--gray-200)] hover:bg-gray-50 transition-all duration-200 no-underline text-sm"
              >
                Prohlédnout nabídku
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* SEO text */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="prose prose-gray prose-headings:font-bold prose-p:text-gray-600 prose-p:leading-relaxed">
          <h2>Jak zjistit cenu ojetého auta?</h2>
          <p>
            Stanovení správné ceny ojetého vozidla je klíčové pro úspěšný prodej. Příliš vysoká cena
            znamená dlouhé čekání na kupce, příliš nízká cena znamená ztrátu peněz. Naše online
            kalkulačka vám poskytne orientační cenové rozpětí na základě statistik z českého trhu
            ojetých vozidel.
          </p>

          <h3>Co ovlivňuje cenu ojetého auta?</h3>
          <p>
            Hlavní faktory určující cenu ojetého vozu jsou: značka a model (prémiové značky si drží
            hodnotu lépe), rok výroby a stáří vozu, celkový nájezd kilometrů, technický stav a vzhled
            karoserie, kompletnost servisní historie, typ paliva a převodovky, úroveň výbavy a aktuální
            tržní nabídka a poptávka. Kalkulačka zohledňuje hlavní faktory, ale pro přesné ocenění
            doporučujeme kontaktovat certifikovaného makléře.
          </p>

          <h3>Proč nechat auto ocenit makléřem?</h3>
          <p>
            Certifikovaný makléř CarMakler přijede přímo k vám, prohlédne vůz osobně a stanoví
            reálnou tržní cenu na základě aktuálních dat z trhu. Služba je zcela zdarma a nezávazná.
            Makléř zohlední faktory, které online kalkulačka nemůže posoudit — celkový stav laku,
            kvalitu interiéru, stav techniky a specifickou výbavu vašeho vozu.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FaqSection items={faqItems} />
      </div>

      {/* CTA */}
      <section className="mt-10">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 py-14 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Chcete přesné ocenění?
            </h2>
            <p className="text-orange-100 mb-8 text-lg">
              Náš makléř ocení vaše auto zdarma a nezávazně. Přijede k vám a stanoví reálnou tržní cenu.
            </p>
            <Link
              href="/chci-prodat"
              className="inline-flex items-center gap-2 py-4 px-8 bg-white text-orange-600 font-bold rounded-full shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 no-underline text-[17px]"
            >
              Bezplatné ocenění
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PriceCalculator } from "@/components/web/PriceCalculator";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { BASE_URL } from "@/lib/seo-data";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Kolik stojí moje auto? | Kalkulačka ceny vozidla — CarMakler",
  description:
    "Zjistěte orientační cenu vašeho ojetého auta online. Kalkulačka ceny vozidla na základě značky, modelu, roku výroby a stavu. Profesionální ocenění makléřem zdarma.",
  openGraph: {
    title: "Kolik stojí moje auto? — kalkulačka ceny",
    description:
      "Zjistěte orientační cenu vašeho vozidla během minuty. Profesionální ocenění makléřem zdarma.",
  },
  alternates: pageCanonical("/kolik-stoji-moje-auto"),
};

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Domů", url: BASE_URL },
  { name: "Kolik stojí moje auto", url: `${BASE_URL}/kolik-stoji-moje-auto` },
]);

const webAppJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Kalkulačka ceny vozidla",
  description: "Zjistěte orientační cenu vašeho ojetého auta online",
  url: `${BASE_URL}/kolik-stoji-moje-auto`,
  applicationCategory: "FinanceApplication",
  operatingSystem: "All",
  offers: { "@type": "Offer", price: "0", priceCurrency: "CZK" },
});

export default function KolikStojiMojeAutoPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: webAppJsonLd }} />

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

      {/* Interactive calculator + FAQ (client component) */}
      <PriceCalculator />

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
            doporučujeme kontaktovat ověřeného makléře.
          </p>

          <h3>Proč nechat auto ocenit makléřem?</h3>
          <p>
            Ověřený makléř CarMakler přijede přímo k vám, prohlédne vůz osobně a stanoví
            reálnou tržní cenu na základě aktuálních dat z trhu. Služba je zcela zdarma a nezávazná.
            Makléř zohlední faktory, které online kalkulačka nemůže posoudit — celkový stav laku,
            kvalitu interiéru, stav techniky a specifickou výbavu vašeho vozu.
          </p>
        </div>
      </section>

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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  generateOrganizationJsonLd,
  generatePartsItemListJsonLd,
  generateFaqPageJsonLd,
} from "@/lib/seo";
import {
  PARTS_BRANDS,
  PARTS_CATEGORIES,
  PARTS_MODELS_BY_BRAND,
  BASE_URL,
} from "@/lib/seo-data";
import { getTopPartsForBrand } from "@/lib/seo/partsItemList";
import { PartsBreadcrumbs } from "@/components/web/dily/PartsBreadcrumbs";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 86400;

const UNIVERSAL_FAQS = [
  {
    question: "Jaká je záruka na použité díly?",
    answer:
      "Na použité originální díly poskytujeme záruku 3 měsíce. Repasované díly mají záruku 12 měsíců.",
  },
  {
    question: "Jak rychle doručíte díl?",
    answer:
      "Standardní doručení do 2-5 pracovních dnů po celé ČR. U rozměrnějších dílů zajistíme přepravní službu.",
  },
  {
    question: "Mohu díl vrátit, pokud nesedí?",
    answer:
      "Ano, máte 14 dnů na vrácení. Doporučujeme vždy ověřit kompatibilitu přes VIN před objednáním.",
  },
];

export function generateStaticParams() {
  return PARTS_BRANDS.map((b) => ({ brand: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
  if (!brandData) return {};

  const title = `Náhradní díly ${brandData.name} | Carmakler`;
  const description = `Použité a nové náhradní díly pro vozy ${brandData.name}. Ověřená vrakoviště, doručení do 5 dnů.`;
  const url = `${BASE_URL}/dily/znacka/${brand}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
  };
}

export default async function PartsBrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;

  // Diakritika 301 redirect handled v middleware.ts (pre-routing) — page-level
  // permanentRedirect tady nefunguje s dynamicParams=false (segment 404 zachytí
  // request dříve než page function spustí).
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
  if (!brandData) notFound();

  const models = PARTS_MODELS_BY_BRAND[brand] || [];
  const { parts: topParts } = await getTopPartsForBrand(brandData.name);

  const itemListJsonLd = generatePartsItemListJsonLd(
    `Náhradní díly ${brandData.name}`,
    topParts.map((p) => ({
      name: p.name,
      url: `${BASE_URL}/dily/${p.slug}`,
    }))
  );
  const faqJsonLd = generateFaqPageJsonLd(UNIVERSAL_FAQS);
  const organizationJsonLd = generateOrganizationJsonLd();

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: itemListJsonLd }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqJsonLd }}
      />

      <PartsBreadcrumbs
        items={[
          { name: "Domů", href: "/" },
          { name: "Díly", href: "/dily" },
          { name: `Díly ${brandData.name}` },
        ]}
      />

      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900">
            Náhradní díly {brandData.name}
          </h1>
          <p className="text-lg text-gray-500 mt-3 max-w-2xl">
            Použité a nové náhradní díly pro vozy {brandData.name} od ověřených
            vrakovišť. Doručení do 5 dnů, záruka funkčnosti.
          </p>
          <div className="mt-6">
            <Link
              href="/dily"
              className="inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold rounded-full shadow-orange hover:-translate-y-0.5 transition-all duration-200 no-underline text-[15px]"
            >
              Hledat díly {brandData.name}
            </Link>
          </div>
        </div>
      </section>

      {/* Models grid */}
      {models.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Top modely {brandData.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {models.map((model) => (
              <Link
                key={model.slug}
                href={`/dily/znacka/${brand}/${model.slug}`}
                className="group flex flex-col p-5 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all no-underline"
              >
                <span className="text-base font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {brandData.name} {model.name}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Náhradní díly →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-white border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Kategorie dílů {brandData.name}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {PARTS_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/dily/kategorie/${cat.slug}`}
              className="group flex flex-col items-center p-5 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all no-underline"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
                <svg
                  className="w-6 h-6 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085"
                  />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors text-center">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top parts ItemList */}
      {topParts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Nejprodávanější díly {brandData.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {topParts.map((part) => (
              <Link
                key={part.id}
                href={`/dily/${part.slug}`}
                className="flex flex-col p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all no-underline"
              >
                <span className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {part.name}
                </span>
                <span className="text-base font-bold text-orange-600 mt-2">
                  {part.price.toLocaleString("cs-CZ")} Kč
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SEO content stub */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="prose prose-gray prose-headings:font-bold prose-p:text-gray-600 prose-p:leading-relaxed">
          <h2>Náhradní díly pro {brandData.name} na CarMakler</h2>
          <p>
            Na CarMakler nabízíme široký výběr náhradních dílů pro vozy{" "}
            {brandData.name}. Použité originální díly z ověřených vrakovišť i nové
            aftermarket díly za výhodné ceny. Všechny díly jsou katalogizovány podle
            VIN kódu pro maximální kompatibilitu s vaším vozem.
          </p>
          <h3>Proč nakupovat díly na CarMakler?</h3>
          <p>
            Všichni naši dodavatelé dílů procházejí verifikací. Díly jsou detailně
            popsány a vyfoceny. Na použité díly poskytujeme záruku funkčnosti.
            Objednávky doručujeme po celé ČR do 2-5 pracovních dní. Platba je možná
            převodem, kartou nebo dobírkou.
          </p>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Časté dotazy</h2>
        <div className="space-y-4">
          {UNIVERSAL_FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group bg-white rounded-xl border border-gray-200 p-5"
            >
              <summary className="flex items-center justify-between cursor-pointer text-base font-semibold text-gray-900">
                {faq.question}
                <span className="text-orange-500 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Other brands */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white border-t border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Díly pro další značky
        </h2>
        <div className="flex flex-wrap gap-3">
          {PARTS_BRANDS.filter((b) => b.slug !== brand).map((b) => (
            <Link
              key={b.slug}
              href={`/dily/znacka/${b.slug}`}
              className="inline-flex items-center py-2 px-4 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 py-14 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Nenašli jste požadovaný díl?
            </h2>
            <p className="text-orange-100 mb-8 text-lg">
              Zadejte poptávku a naši dodavatelé vám pošlou nabídky. Služba je
              zdarma.
            </p>
            <Link
              href="/dily"
              className="inline-flex items-center gap-2 py-4 px-8 bg-white text-orange-600 font-bold rounded-full shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 no-underline text-[17px]"
            >
              Hledat díly
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

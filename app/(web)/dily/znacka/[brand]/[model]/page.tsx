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
  PARTS_MODELS_BY_BRAND,
  PARTS_CATEGORIES,
  BASE_URL,
} from "@/lib/seo-data";
import { getTopPartsForBrandModel } from "@/lib/seo/partsItemList";
import { loadPartsModelContent } from "@/lib/seo/loadPartsContent";
import { PartsBreadcrumbs } from "@/components/web/dily/PartsBreadcrumbs";
import { pageCanonical } from "@/lib/canonical";

export const dynamic = "force-static";
export const dynamicParams = true;
export const revalidate = 86400;

export function generateStaticParams() {
  return PARTS_BRANDS.flatMap((brand) =>
    (PARTS_MODELS_BY_BRAND[brand.slug] || []).map((model) => ({
      brand: brand.slug,
      model: model.slug,
    }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}): Promise<Metadata> {
  const { brand, model } = await params;
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
  const modelData = (PARTS_MODELS_BY_BRAND[brand] || []).find(
    (m) => m.slug === model
  );
  if (!brandData || !modelData) return {};

  const seo = await loadPartsModelContent(
    brandData.slug,
    brandData.name,
    modelData.slug,
    modelData.name
  );
  const url = `${BASE_URL}/dily/znacka/${brand}/${model}`;

  return {
    title: seo.metaTitle,
    description: seo.metaDesc,
    alternates: pageCanonical(`/dily/znacka/${brand}/${model}`),
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDesc,
      url,
      type: "website",
    },
  };
}

export default async function PartsBrandModelPage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand, model } = await params;

  // Diakritika 301 redirect handled v middleware.ts (pre-routing).
  const brandData = PARTS_BRANDS.find((b) => b.slug === brand);
  if (!brandData) notFound();

  const modelData = (PARTS_MODELS_BY_BRAND[brand] || []).find(
    (m) => m.slug === model
  );
  if (!modelData) notFound();

  const { parts: topParts } = await getTopPartsForBrandModel(
    brandData.name,
    modelData.name
  );
  const seo = await loadPartsModelContent(
    brandData.slug,
    brandData.name,
    modelData.slug,
    modelData.name
  );

  const itemListJsonLd = generatePartsItemListJsonLd(
    `Náhradní díly ${brandData.name} ${modelData.name}`,
    topParts.map((p) => ({
      name: p.name,
      url: `${BASE_URL}/dily/${p.slug}`,
    }))
  );
  const faqJsonLd = generateFaqPageJsonLd(seo.faq);
  const organizationJsonLd = generateOrganizationJsonLd();

  const topYears = modelData.topYears ?? [2015, 2018, 2020];
  const otherModels = (PARTS_MODELS_BY_BRAND[brand] || []).filter(
    (m) => m.slug !== model
  );

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
          { name: brandData.name, href: `/dily/znacka/${brand}` },
          { name: modelData.name },
        ]}
      />

      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900">
            Náhradní díly {brandData.name} {modelData.name}
          </h1>
          <p className="text-lg text-gray-500 mt-3 max-w-2xl">
            Originální použité díly pro {brandData.name} {modelData.name} od
            ověřených vrakovišť za výhodné ceny. Brzdy, motory, karoserie a
            další.
          </p>
          <div className="mt-6">
            <Link
              href="/dily"
              className="inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold rounded-full shadow-orange hover:-translate-y-0.5 transition-all duration-200 no-underline text-[15px]"
            >
              Hledat díly {modelData.name}
            </Link>
          </div>
        </div>
      </section>

      {/* Generations */}
      {modelData.generations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Generace {brandData.name} {modelData.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {modelData.generations.map((gen) => (
              <div
                key={gen.name}
                className="p-5 bg-white rounded-xl border border-gray-200"
              >
                <div className="text-base font-semibold text-gray-900">
                  {gen.name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {gen.yearFrom} – {gen.yearTo}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top years */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Díly podle ročníku
        </h2>
        <div className="flex flex-wrap gap-3">
          {topYears.map((year) => (
            <Link
              key={year}
              href={`/dily/znacka/${brand}/${model}/${year}`}
              className="inline-flex items-center py-3 px-6 bg-white text-gray-900 rounded-full text-base font-semibold border border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline"
            >
              {brandData.name} {modelData.name} {year}
            </Link>
          ))}
        </div>
      </section>

      {/* Top parts ItemList */}
      {topParts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 bg-white border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Nejprodávanější díly {brandData.name} {modelData.name}
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

      {/* Categories filter chips */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Hledat díly podle kategorie
        </h2>
        <div className="flex flex-wrap gap-3">
          {PARTS_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/dily/kategorie/${cat.slug}`}
              className="inline-flex items-center py-2 px-4 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* SEO content (DB → template fallback) */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div
          className="prose prose-gray prose-headings:font-bold prose-p:text-gray-600 prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: seo.introHtml }}
        />
        {seo.sections.map((s) => (
          <div key={s.h2} className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{s.h2}</h2>
            <div
              className="prose prose-gray prose-headings:font-bold prose-p:text-gray-600 prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: s.html }}
            />
          </div>
        ))}
      </section>

      {/* AI snippet (krátká pasáž optimalizovaná pro LLM agregaci) */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
          <div className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">
            Shrnutí
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {seo.aiSnippetText}
          </p>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Časté dotazy</h2>
        <div className="space-y-4">
          {seo.faq.map((faq) => (
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

      {/* Other models */}
      {otherModels.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white border-t border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Další modely {brandData.name}
          </h2>
          <div className="flex flex-wrap gap-3">
            {otherModels.map((m) => (
              <Link
                key={m.slug}
                href={`/dily/znacka/${brand}/${m.slug}`}
                className="inline-flex items-center py-2 px-4 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline"
              >
                {brandData.name} {m.name}
              </Link>
            ))}
          </div>
        </section>
      )}

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

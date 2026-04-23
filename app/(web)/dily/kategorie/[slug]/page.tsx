import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FAQ } from "@/components/web/FAQ";
import { generateBreadcrumbJsonLd, generateFaqJsonLd } from "@/lib/seo";
import { PARTS_CATEGORIES, PARTS_BRANDS, BASE_URL } from "@/lib/seo-data";
import { pageCanonical } from "@/lib/canonical";

export function generateStaticParams() {
  return PARTS_CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = PARTS_CATEGORIES.find((c) => c.slug === slug);
  if (!category) return {};

  return {
    title: `${category.name} | Náhradní díly`,
    description: `Náhradní díly — ${category.name.toLowerCase()}. Použité i nové díly od ověřených dodavatelů za výhodné ceny s garancí funkčnosti.`,
    alternates: pageCanonical(`/dily/kategorie/${slug}`),
    openGraph: {
      title: `${category.name} | Náhradní díly CarMakler`,
      description: `${category.name} — použité i nové díly za výhodné ceny.`,
    },
  };
}

export default async function PartsCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = PARTS_CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Domů", url: BASE_URL },
    { name: "Díly", url: `${BASE_URL}/dily` },
    { name: category.name, url: `${BASE_URL}/dily/kategorie/${category.slug}` },
  ]);
  const faqJsonLd = generateFaqJsonLd(category.faqItems);

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-orange-500 transition-colors no-underline text-gray-500">Domů</Link></li>
            <li className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              <Link href="/dily" className="hover:text-orange-500 transition-colors no-underline text-gray-500">Díly</Link>
            </li>
            <li className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              <span className="text-gray-900 font-medium">{category.name}</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900">
            {category.name} — náhradní díly
          </h1>
          <p className="text-lg text-gray-500 mt-3 max-w-2xl">
            Použité i nové {category.name.toLowerCase()} od ověřených dodavatelů za výhodné ceny.
          </p>
          <div className="mt-6">
            <Link
              href="/dily"
              className="inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold rounded-full shadow-orange hover:-translate-y-0.5 transition-all duration-200 no-underline text-[15px]"
            >
              Hledat díly
            </Link>
          </div>
        </div>
      </section>

      {/* SEO content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="prose prose-gray prose-headings:font-bold prose-p:text-gray-600 prose-p:leading-relaxed">
          <p>{category.description}</p>
          <h2>Díly podle značky vozu</h2>
          <p>
            Hledáte {category.name.toLowerCase()} pro konkrétní značku? Vyberte značku vozu
            a zobrazí se kompatibilní díly. Všechny díly jsou katalogizovány podle VIN kódu
            pro maximální kompatibilitu.
          </p>
        </div>
      </section>

      {/* Brand links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{category.name} podle značky</h2>
        <div className="flex flex-wrap gap-3">
          {PARTS_BRANDS.map((brand) => (
            <Link
              key={brand.slug}
              href={`/dily/znacka/${brand.slug}`}
              className="inline-flex items-center py-2 px-4 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200 hover:border-orange-300 hover:text-orange-600 transition-colors no-underline"
            >
              {brand.name}
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FAQ items={category.faqItems} variant="divider" title="Často kladené otázky" />
      </div>

      {/* Related categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Další kategorie dílů</h2>
        <div className="flex flex-wrap gap-3">
          {PARTS_CATEGORIES.filter((c) => c.slug !== slug).map((cat) => (
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

      {/* CTA */}
      <section>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 py-14 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Jste vrakoviště nebo dodavatel dílů?
            </h2>
            <p className="text-orange-100 mb-8 text-lg">
              Přidejte se k CarMakler a prodávejte své díly tisícům zákazníků. Registrace je zdarma.
            </p>
            <Link
              href="/registrace/dodavatel"
              className="inline-flex items-center gap-2 py-4 px-8 bg-white text-orange-600 font-bold rounded-full shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 no-underline text-[17px]"
            >
              Registrovat se jako dodavatel
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

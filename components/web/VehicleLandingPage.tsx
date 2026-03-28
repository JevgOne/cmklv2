import Link from "next/link";
import { FaqSection } from "./FaqSection";
import type { FaqSectionItem } from "./FaqSection";

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface RelatedLink {
  label: string;
  href: string;
}

interface VehicleLandingPageProps {
  title: string;
  description: string;
  h1: string;
  filterDescription?: string;
  seoText: React.ReactNode;
  faqItems: FaqSectionItem[];
  breadcrumbs: BreadcrumbItem[];
  jsonLdScripts: string[];
  ctaText?: string;
  ctaHref?: string;
  ctaHeading?: string;
  relatedLinks?: RelatedLink[];
  filterHref?: string;
  children?: React.ReactNode;
}

export function VehicleLandingPage({
  h1,
  filterDescription,
  seoText,
  faqItems,
  breadcrumbs,
  jsonLdScripts,
  ctaText = "Prodat auto s makléřem",
  ctaHref = "/chci-prodat",
  ctaHeading = "Chcete prodat auto?",
  relatedLinks,
  filterHref,
  children,
}: VehicleLandingPageProps) {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* JSON-LD structured data */}
      {jsonLdScripts.map((script, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: script }}
        />
      ))}

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-1.5">
                {index > 0 && (
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-900 font-medium">{crumb.name}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-orange-500 transition-colors no-underline text-gray-500">
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* Hero section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900">
            {h1}
          </h1>
          {filterDescription && (
            <p className="text-lg text-gray-500 mt-3 max-w-2xl">
              {filterDescription}
            </p>
          )}
          {filterHref && (
            <div className="mt-6">
              <Link
                href={filterHref}
                className="inline-flex items-center gap-2 py-3 px-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold rounded-full shadow-orange hover:-translate-y-0.5 hover:shadow-orange-hover transition-all duration-200 no-underline text-[15px]"
              >
                Zobrazit vozy v nabídce
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Optional children (model grid, etc.) */}
      {children && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {children}
        </section>
      )}

      {/* SEO text content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="prose prose-gray max-w-3xl prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-600 prose-p:leading-relaxed">
          {seoText}
        </div>
      </section>

      {/* FAQ section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FaqSection items={faqItems} />
      </section>

      {/* CTA section */}
      <section className="mt-10 mb-0">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 py-14 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {ctaHeading}
            </h2>
            <p className="text-orange-100 mb-8 text-lg">
              Nechte to na nás. Certifikovaný makléř prodá vaše auto rychle, bezpečně a za nejlepší cenu.
            </p>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 py-4 px-8 bg-white text-orange-600 font-bold rounded-full shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 no-underline text-[17px]"
            >
              {ctaText}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Related links */}
      {relatedLinks && relatedLinks.length > 0 && (
        <section className="bg-white border-t border-gray-200 py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Další nabídky
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="inline-flex items-center py-2 px-4 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

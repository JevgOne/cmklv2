import Link from "next/link";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { BASE_URL } from "@/lib/seo-data";

export interface BreadcrumbItem {
  /** Display name */
  name: string;
  /** Path-only URL (without origin); undefined = current page (no link) */
  href?: string;
}

/**
 * Reusable breadcrumb komponenta pro `/dily/*` landing pages.
 * Renderuje JSON-LD `BreadcrumbList` + accessible `<nav>` markup.
 *
 * Per #87b plán §8.2. Akceptuje path-only `href` (bez origin) — JSON-LD si
 * absolutní URL složí přes `BASE_URL`.
 */
export function PartsBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = generateBreadcrumbJsonLd(
    items.map((item) => ({
      name: item.name,
      url: item.href ? `${BASE_URL}${item.href}` : "",
    }))
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            {items.map((item, idx) => (
              <li key={`${item.name}-${idx}`} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight />}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="hover:text-orange-500 transition-colors no-underline text-gray-500"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium" aria-current="page">
                    {item.name}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
}

function ChevronRight() {
  return (
    <svg
      className="w-4 h-4 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

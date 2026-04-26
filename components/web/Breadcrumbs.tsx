import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `https://carmakler.cz${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="Breadcrumb"
        className={className || "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"}
      >
        <ol className="flex items-center gap-2 text-sm text-gray-500 list-none p-0 m-0">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>/</span>}
              {item.href && i < items.length - 1 ? (
                <Link
                  href={item.href}
                  className="hover:text-gray-900 transition-colors no-underline text-gray-500"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={i === items.length - 1 ? "text-gray-900 font-medium" : ""}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

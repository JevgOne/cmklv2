import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/web/ProductCard";
import { PartsFilters } from "@/components/web/PartsFilters";
import { Button } from "@/components/ui/Button";
import { pageCanonical } from "@/lib/canonical";
import { generateBreadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Katalog dílů a příslušenství",
  description:
    "Prohlédněte si nabídku autodílů a příslušenství. Nové i použité díly s garancí kvality.",
  openGraph: {
    title: "Katalog dílů | CarMakléř",
    description:
      "Autodíly a příslušenství — nové, použité i repasované. Rychlé doručení.",
  },
  alternates: pageCanonical("/shop/katalog"),
};

function conditionToStars(condition: string): number | undefined {
  switch (condition) {
    case "NEW":
      return undefined;
    case "USED_GOOD":
      return 4;
    case "USED_FAIR":
      return 3;
    case "USED_POOR":
      return 2;
    case "REFURBISHED":
      return 5;
    default:
      return undefined;
  }
}

export default async function KatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  // --- Build Prisma where clause ---
  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (params.category) where.category = params.category;
  if (params.condition) where.condition = params.condition;
  if (params.brand) where.compatibleBrands = { contains: params.brand };

  if (params.minPrice || params.maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (params.minPrice) priceFilter.gte = parseInt(params.minPrice, 10);
    if (params.maxPrice) priceFilter.lte = parseInt(params.maxPrice, 10);
    where.price = priceFilter;
  }

  if (params.inStock === "true") where.stock = { gt: 0 };

  // --- Sorting ---
  type SortOrder = "asc" | "desc";
  let orderBy: Record<string, SortOrder>[];
  switch (params.sort) {
    case "cheapest":
      orderBy = [{ price: "asc" }];
      break;
    case "expensive":
      orderBy = [{ price: "desc" }];
      break;
    case "popular":
      orderBy = [{ viewCount: "desc" }];
      break;
    default:
      orderBy = [{ createdAt: "desc" }];
      break;
  }

  // --- Pagination ---
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const limit = 18;
  const skip = (page - 1) * limit;

  // --- Prisma query ---
  const [parts, total] = await Promise.all([
    prisma.part.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        supplier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.part.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // --- JSON-LD ---
  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Katalog autodílů — CarMakléř",
    description: "Autodíly a příslušenství pro všechny značky.",
    numberOfItems: total,
    itemListElement: parts.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://carmakler.cz/shop/${p.slug}`,
      name: p.name,
    })),
  };

  // --- Pagination URL builder ---
  const buildPageUrl = (p: number) => {
    const urlParams = new URLSearchParams(params);
    urlParams.set("page", String(p));
    return `/shop/katalog?${urlParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateBreadcrumbJsonLd([
            { name: "Domů", url: "https://carmakler.cz" },
            { name: "Shop", url: "https://carmakler.cz/shop" },
            { name: "Katalog", url: "https://carmakler.cz/shop/katalog" },
          ]),
        }}
      />

      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Katalog dílů a příslušenství
          </h1>
          <p className="text-gray-500 mt-2">
            <span className="font-bold text-orange-500">{total}</span> produktů
            v nabídce
          </p>
        </div>
      </section>

      {/* Filters (CLIENT ISLAND) + Grid (SERVER) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PartsFilters variant="shop" resultCount={total} />

        {/* Product grid — SERVER rendered */}
        {parts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parts.map((part) => (
              <ProductCard
                key={part.id}
                partId={part.id}
                name={part.name}
                compatibility={
                  part.compatibleBrands
                    ? JSON.parse(part.compatibleBrands).join(", ")
                    : "Univerzální"
                }
                condition={conditionToStars(part.condition)}
                price={part.price}
                badge={
                  part.partType === "NEW"
                    ? "new"
                    : part.partType === "AFTERMARKET"
                      ? "aftermarket"
                      : "used"
                }
                slug={part.slug}
                image={part.images[0]?.url}
                stock={part.stock}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">&#128269;</span>
            <h3 className="text-xl font-bold text-gray-900">
              Žádné díly nenalezeny
            </h3>
            <p className="text-gray-500 mt-2">
              Zkuste změnit filtry nebo hledejte v jiné kategorii.
            </p>
          </div>
        )}

        {/* Link-based pagination — SERVER rendered */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            {page > 1 && (
              <Link href={buildPageUrl(page - 1)} className="no-underline">
                <Button variant="outline" size="default">
                  &larr; Předchozí
                </Button>
              </Link>
            )}
            <span className="text-sm text-gray-500">
              Stránka {page} z {totalPages}
            </span>
            {page < totalPages && (
              <Link href={buildPageUrl(page + 1)} className="no-underline">
                <Button variant="outline" size="default">
                  Další &rarr;
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

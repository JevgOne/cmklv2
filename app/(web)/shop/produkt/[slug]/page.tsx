import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

export const revalidate = 600; // ISR: 10 minut
import { Card } from "@/components/ui/Card";
import { ProductCard } from "@/components/web/ProductCard";
import { ProductDetailTabs } from "./ProductDetailTabs";
import { AddToCartButton } from "./AddToCartButton";
import { prisma } from "@/lib/prisma";
import { getCategoryLabel, getConditionLabel } from "@/lib/parts-categories";
import type { PartCategory, PartCondition } from "@/types/parts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const part = await prisma.part.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: { name: true, description: true, price: true, category: true },
  });
  if (!part) return { title: "Díl nenalezen" };
  const price = new Intl.NumberFormat("cs-CZ").format(part.price);
  return {
    title: `${part.name} — ${price} Kč | Shop CarMakléř`,
    description:
      part.description?.slice(0, 155) ||
      `Kupte ${part.name} za ${price} Kč na CarMakléř. Kategorie: ${getCategoryLabel(part.category as PartCategory)}.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= count ? "text-orange-400" : "text-gray-200"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function formatCzk(price: number): string {
  return new Intl.NumberFormat("cs-CZ").format(price);
}

function conditionToStars(condition: string): number {
  switch (condition) {
    case "USED_GOOD":
      return 4;
    case "USED_FAIR":
      return 3;
    case "USED_POOR":
      return 2;
    case "REFURBISHED":
      return 5;
    case "NEW":
    default:
      return 5;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const part = await prisma.part.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: {
      images: { orderBy: { order: "asc" } },
      supplier: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          avatar: true,
          cities: true,
        },
      },
    },
  });

  if (!part) {
    notFound();
  }

  // Inkrementovat view count
  await prisma.part.update({
    where: { id: part.id },
    data: { viewCount: { increment: 1 } },
  });

  // Načíst podobné díly (stejná kategorie)
  const similarParts = await prisma.part.findMany({
    where: {
      status: "ACTIVE",
      category: part.category,
      id: { not: part.id },
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 3,
  });

  const compatibleBrands: string[] = part.compatibleBrands
    ? JSON.parse(part.compatibleBrands)
    : [];
  const compatibleModels: string[] = part.compatibleModels
    ? JSON.parse(part.compatibleModels)
    : [];

  const supplierName = part.supplier.companyName
    ?? `${part.supplier.firstName} ${part.supplier.lastName}`;
  const supplierCity = part.supplier.cities
    ? JSON.parse(part.supplier.cities)[0] ?? ""
    : "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/shop"
              className="hover:text-orange-500 transition-colors no-underline text-gray-500"
            >
              Shop
            </Link>
            <span>/</span>
            <Link
              href="/shop/katalog"
              className="hover:text-orange-500 transition-colors no-underline text-gray-500"
            >
              Katalog
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{part.name}</span>
          </nav>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Main product layout                                           */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Left — Gallery */}
          <div>
            {/* Main image */}
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
              {part.images[0] ? (
                <img
                  src={part.images[0].url}
                  alt={part.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <span className="text-7xl block mb-3">🔧</span>
                  <span className="text-sm text-gray-500">Bez fotky</span>
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {part.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {part.images.slice(0, 4).map((img, i) => (
                  <div
                    key={img.id}
                    className={`aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer transition-all ${
                      i === 0
                        ? "ring-2 ring-orange-500"
                        : "hover:ring-2 hover:ring-gray-300"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${part.name} - foto ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Product info */}
          <div>
            {/* Badge */}
            <div className="mb-3">
              <Badge variant={part.partType === "NEW" ? "success" : part.partType === "AFTERMARKET" ? "default" : "default"}>
                {part.partType === "NEW" ? "Nový díl" : part.partType === "AFTERMARKET" ? "Aftermarket" : "Použitý"}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
              {part.name}
            </h1>

            {/* Compatibility */}
            <p className="text-gray-500 mt-2 text-lg">
              {compatibleBrands.length > 0
                ? `${compatibleBrands.join(", ")} ${compatibleModels.join(", ")}`
                : part.universalFit
                  ? "Univerzální"
                  : getCategoryLabel(part.category as PartCategory)}
              {part.compatibleYearFrom && part.compatibleYearTo
                ? ` ${part.compatibleYearFrom}-${part.compatibleYearTo}`
                : ""}
            </p>

            {/* OEM / Part number */}
            {(part.oemNumber || part.partNumber) && (
              <p className="text-sm text-gray-500 mt-1 font-mono">
                {part.oemNumber ? `OE: ${part.oemNumber}` : ""}
                {part.oemNumber && part.partNumber ? " | " : ""}
                {part.partNumber ? `PN: ${part.partNumber}` : ""}
              </p>
            )}

            {/* Divider */}
            <hr className="my-6 border-gray-200" />

            {/* Condition */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                Stav dílu
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <Stars count={conditionToStars(part.condition)} />
                <span className="font-semibold text-gray-900">
                  {getConditionLabel(part.condition as PartCondition)}
                </span>
              </div>
            </div>

            {/* Category */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">
                Kategorie
              </h3>
              <p className="text-gray-600">
                {getCategoryLabel(part.category as PartCategory)}
              </p>
            </div>

            {/* Description */}
            {part.description && (
              <div className="mb-6 p-4 bg-gray-100 rounded-xl">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {part.description}
                </p>
              </div>
            )}

            {/* Supplier */}
            <div className="mb-6 p-4 bg-gray-100 rounded-xl">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                Dodavatel
              </h3>
              <div className="text-sm">
                <span className="font-medium text-gray-900">
                  {supplierName}
                </span>
                {supplierCity && (
                  <span className="text-gray-500 ml-2">{supplierCity}</span>
                )}
              </div>
            </div>

            {/* Divider */}
            <hr className="my-6 border-gray-200" />

            {/* Price */}
            <div className="mb-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                {formatCzk(part.price)} Kč
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {part.vatIncluded ? "Cena včetně DPH" : "Cena bez DPH"}
              </p>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              {part.stock > 0 ? (
                <>
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <span className="text-green-600 font-semibold text-sm">
                    Skladem ({part.stock} ks)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  <span className="text-red-600 font-semibold text-sm">
                    Vyprodáno
                  </span>
                </>
              )}
            </div>

            {/* CTA */}
            <AddToCartButton
              partId={part.id}
              name={part.name}
              price={part.price}
              slug={part.slug}
              image={part.images[0]?.url ?? null}
              stock={part.stock}
              supplierId={part.supplier.id}
              supplierName={supplierName}
            />

            {/* Contact */}
            <div className="mt-4 text-center">
              <Link
                href="/kontakt"
                className="text-orange-500 font-semibold text-sm hover:text-orange-600 transition-colors no-underline"
              >
                Máte dotaz? Napište nám
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Tabs: Popis / Kompatibilita / Záruka                        */}
        {/* ============================================================ */}
        <div className="mt-12">
          <ProductDetailTabs
            description={part.description}
            compatibleBrands={compatibleBrands}
            compatibleModels={compatibleModels}
            yearFrom={part.compatibleYearFrom}
            yearTo={part.compatibleYearTo}
            universalFit={part.universalFit}
            weight={part.weight}
            dimensions={part.dimensions}
          />
        </div>

        {/* ============================================================ */}
        {/* Similar parts                                                */}
        {/* ============================================================ */}
        {similarParts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8">
              Podobné díly
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarParts.map((p) => (
                <ProductCard
                  key={p.id}
                  partId={p.id}
                  name={p.name}
                  compatibility={
                    p.compatibleBrands
                      ? JSON.parse(p.compatibleBrands).join(", ")
                      : "Univerzální"
                  }
                  condition={
                    p.condition === "NEW"
                      ? undefined
                      : p.condition === "USED_GOOD"
                        ? 4
                        : p.condition === "USED_FAIR"
                          ? 3
                          : p.condition === "USED_POOR"
                            ? 2
                            : 5
                  }
                  price={p.price}
                  badge={p.partType === "NEW" ? "new" : p.partType === "AFTERMARKET" ? "aftermarket" : "used"}
                  slug={p.slug}
                  image={p.images[0]?.url}
                  stock={p.stock}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

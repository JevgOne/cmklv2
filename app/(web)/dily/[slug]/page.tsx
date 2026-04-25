import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProductCard } from "@/components/web/ProductCard";
import { ProductDetailTabs } from "@/app/(web)/shop/produkt/[slug]/ProductDetailTabs";
import { AddToCartButton } from "@/app/(web)/shop/produkt/[slug]/AddToCartButton";
import { prisma } from "@/lib/prisma";
import { getCategoryLabel, getConditionLabel } from "@/lib/parts-categories";
import type { PartCategory, PartCondition } from "@/types/parts";

export const revalidate = 86400;

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
    title: `${part.name} — ${price} Kč | Díly CarMakléř`,
    description:
      part.description?.slice(0, 155) ||
      `Kupte ${part.name} za ${price} Kč na CarMakléř. Kategorie: ${getCategoryLabel(part.category as PartCategory)}.`,
  };
}

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= count ? "text-orange-400" : "text-gray-200"}>
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
    case "USED_GOOD": return 4;
    case "USED_FAIR": return 3;
    case "USED_POOR": return 2;
    case "REFURBISHED": return 5;
    case "NEW":
    default: return 5;
  }
}

function getPartTypeBadge(partType: string): "used" | "new" | "aftermarket" {
  switch (partType) {
    case "NEW": return "new";
    case "AFTERMARKET": return "aftermarket";
    default: return "used";
  }
}

function getPartTypeLabel(partType: string): string {
  switch (partType) {
    case "NEW": return "Nový díl";
    case "AFTERMARKET": return "Aftermarket";
    default: return "Použitý";
  }
}

function getPartTypeBadgeVariant(partType: string): "success" | "default" {
  switch (partType) {
    case "NEW": return "success";
    case "AFTERMARKET": return "default";
    default: return "default";
  }
}

export default async function DilyDetailPage({
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

  await prisma.part.update({
    where: { id: part.id },
    data: { viewCount: { increment: 1 } },
  });

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

  // U aftermarket dílů zobrazit jako "Carmakler Shop"
  const supplierName = part.partType === "AFTERMARKET" || part.partType === "NEW"
    ? "CarMakléř Shop"
    : (part.supplier.companyName ?? `${part.supplier.firstName} ${part.supplier.lastName}`);
  const supplierCity = part.supplier.cities
    ? JSON.parse(part.supplier.cities)[0] ?? ""
    : "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/dily" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
              Díly
            </Link>
            <span>/</span>
            <Link href="/dily/katalog" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
              Katalog
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{part.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Left — Gallery */}
          <div>
            <div className="relative aspect-square bg-gray-100 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
              {part.images[0] ? (
                <Image src={part.images[0].url} alt={part.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              ) : (
                <div className="text-center">
                  <span className="text-7xl block mb-3">🔧</span>
                  <span className="text-sm text-gray-500">Bez fotky</span>
                </div>
              )}
            </div>
            {part.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {part.images.slice(0, 4).map((img, i) => (
                  <div
                    key={img.id}
                    className={`relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer transition-all ${
                      i === 0 ? "ring-2 ring-orange-500" : "hover:ring-2 hover:ring-gray-300"
                    }`}
                  >
                    <Image src={img.url} alt={`${part.name} - foto ${i + 1}`} fill className="object-cover" sizes="25vw" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Product info */}
          <div>
            {/* Badge */}
            <div className="mb-3">
              <Badge variant={getPartTypeBadgeVariant(part.partType)}>
                {getPartTypeLabel(part.partType)}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">
              {part.name}
            </h1>

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

            {(part.oemNumber || part.partNumber) && (
              <p className="text-sm text-gray-500 mt-1 font-mono">
                {part.oemNumber ? `OE: ${part.oemNumber}` : ""}
                {part.oemNumber && part.partNumber ? " | " : ""}
                {part.partNumber ? `PN: ${part.partNumber}` : ""}
              </p>
            )}

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

            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">
                Kategorie
              </h3>
              <p className="text-gray-600">
                {getCategoryLabel(part.category as PartCategory)}
              </p>
            </div>

            {part.description && (
              <div className="mb-6 p-4 bg-gray-100 rounded-xl">
                <p className="text-gray-600 text-sm leading-relaxed">{part.description}</p>
              </div>
            )}

            {(part.manufacturer || part.warranty) && (
              <div className="mb-6 p-4 bg-gray-100 rounded-xl space-y-2">
                {part.manufacturer && (
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-700 uppercase tracking-wide">
                      Výrobce
                    </span>
                    <span className="text-gray-900">{part.manufacturer}</span>
                  </div>
                )}
                {part.warranty && (
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-700 uppercase tracking-wide">
                      Záruka
                    </span>
                    <span className="text-gray-900">{part.warranty}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mb-6 p-4 bg-gray-100 rounded-xl">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                Dodavatel
              </h3>
              <div className="text-sm">
                <span className="font-medium text-gray-900">{supplierName}</span>
                {supplierCity && part.partType === "USED" && (
                  <span className="text-gray-500 ml-2">{supplierCity}</span>
                )}
              </div>
            </div>

            <hr className="my-6 border-gray-200" />

            <div className="mb-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                {formatCzk(part.price)} Kč
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {part.vatIncluded ? "Cena včetně DPH" : "Cena bez DPH"}
              </p>
            </div>

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
                  <span className="text-red-600 font-semibold text-sm">Vyprodáno</span>
                </>
              )}
            </div>

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

        {/* Tabs */}
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

        {/* Similar parts */}
        {similarParts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Podobné díly</h2>
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
                  condition={conditionToStars(p.condition)}
                  price={p.price}
                  badge={getPartTypeBadge(p.partType)}
                  slug={p.slug}
                  image={p.images[0]?.url}
                  stock={p.stock}
                  basePath="/dily"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

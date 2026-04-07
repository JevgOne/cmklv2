import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProductCard } from "@/components/web/ProductCard";
import { prisma } from "@/lib/prisma";
import {
  generateBreadcrumbJsonLd,
  generateStoreJsonLd,
  generateItemListJsonLd,
  generateOrganizationJsonLd,
} from "@/lib/seo";
import { BASE_URL } from "@/lib/seo-data";
import { pageCanonical } from "@/lib/canonical";

// ISR — revalidate každých 24h (parts inventář se mění průběžně, partner info zřídka)
export const revalidate = 86400;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-build static pages pro všechna aktivní vrakoviště typu VRAKOVISTE.
 * Per-build snapshot — nově aktivovaná vrakoviště fallback ISR (dynamicParams=true).
 */
export async function generateStaticParams() {
  try {
    const partners = await prisma.partner.findMany({
      where: { status: "AKTIVNI_PARTNER", type: "VRAKOVISTE" },
      select: { slug: true },
    });
    return partners.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

async function getPartnerWithParts(slug: string) {
  const partner = await prisma.partner.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      status: true,
      city: true,
      region: true,
      address: true,
      zip: true,
      latitude: true,
      longitude: true,
      phone: true,
      email: true,
      web: true,
      logo: true,
      description: true,
      score: true,
      googleRating: true,
      googleReviewCount: true,
      openingHours: true,
      userId: true,
    },
  });

  if (!partner || partner.status !== "AKTIVNI_PARTNER") return null;
  if (partner.type !== "VRAKOVISTE") return null;

  // Parts pouze pokud má partner přiřazený user account (PARTNER_VRAKOVISTE role)
  let parts: Array<{
    id: string;
    slug: string;
    name: string;
    category: string;
    price: number;
    partType: string;
    condition: string;
    stock: number;
    images: { url: string }[];
    compatibleBrands: string | null;
    compatibleModels: string | null;
  }> = [];
  let partsCount = 0;

  if (partner.userId) {
    const [list, count] = await Promise.all([
      prisma.part.findMany({
        where: { supplierId: partner.userId, status: "ACTIVE" },
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          price: true,
          partType: true,
          condition: true,
          stock: true,
          compatibleBrands: true,
          compatibleModels: true,
          images: { select: { url: true }, orderBy: { order: "asc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      }),
      prisma.part.count({
        where: { supplierId: partner.userId, status: "ACTIVE" },
      }),
    ]);
    parts = list;
    partsCount = count;
  }

  return { partner, parts, partsCount };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPartnerWithParts(slug);
  if (!data) return { title: "Vrakoviště nenalezeno — Carmakler" };

  const { partner, partsCount } = data;
  const regionPart = partner.region || partner.city || "ČR";
  const titleBase = `Díly z ${partner.name} — Carmakler`;
  const description = `${partsCount > 0 ? `${partsCount} náhradních dílů` : "Náhradní díly"} od ověřeného vrakoviště ${partner.name} (${regionPart}). Originální použité díly s dopravou po celé ČR za 2-5 dnů.`;

  return {
    title: titleBase,
    description,
    alternates: pageCanonical(`/dily/vrakoviste/${partner.slug}`),
    openGraph: {
      title: titleBase,
      description,
      url: `${BASE_URL}/dily/vrakoviste/${partner.slug}`,
      type: "website",
      images: partner.logo ? [{ url: partner.logo }] : undefined,
    },
  };
}

function compatibilityLabel(brandsJson: string | null, modelsJson: string | null): string {
  try {
    const brands = brandsJson ? (JSON.parse(brandsJson) as string[]) : [];
    const models = modelsJson ? (JSON.parse(modelsJson) as string[]) : [];
    if (brands.length && models.length) return `${brands[0]} ${models[0]}`;
    if (brands.length) return brands[0];
    return "Univerzální";
  } catch {
    return "Univerzální";
  }
}

function partTypeBadge(partType: string): "used" | "new" | "aftermarket" {
  if (partType === "NEW") return "new";
  if (partType === "AFTERMARKET") return "aftermarket";
  return "used";
}

function conditionToStars(condition: string): number {
  switch (condition) {
    case "NEW":
    case "REFURBISHED":
      return 5;
    case "USED_GOOD":
      return 4;
    case "USED_FAIR":
      return 3;
    case "USED_POOR":
      return 2;
    default:
      return 4;
  }
}

export default async function VrakovisteLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPartnerWithParts(slug);
  if (!data) notFound();

  const { partner, parts, partsCount } = data;
  const url = `${BASE_URL}/dily/vrakoviste/${partner.slug}`;
  const regionLabel = partner.region || partner.city || "ČR";

  // JSON-LD
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Domů", url: BASE_URL },
    { name: "Díly", url: `${BASE_URL}/dily` },
    { name: "Vrakoviště", url: `${BASE_URL}/dily/vrakoviste` },
    { name: partner.name, url },
  ]);

  const storeJsonLd = generateStoreJsonLd({
    name: partner.name,
    description:
      partner.description ||
      `Vrakoviště ${partner.name} v ${regionLabel}. Originální použité díly z verifikovaných zdrojů.`,
    url,
    logo: partner.logo || undefined,
    address: {
      streetAddress: partner.address || undefined,
      addressLocality: partner.city || undefined,
      addressRegion: partner.region || undefined,
      postalCode: partner.zip || undefined,
    },
    telephone: partner.phone || undefined,
    email: partner.email || undefined,
    geo:
      partner.latitude && partner.longitude
        ? { latitude: partner.latitude, longitude: partner.longitude }
        : undefined,
    openingHours: partner.openingHours || undefined,
    aggregateRating:
      partner.googleRating && partner.googleReviewCount
        ? { ratingValue: partner.googleRating, reviewCount: partner.googleReviewCount }
        : undefined,
  });

  const itemListJsonLd = generateItemListJsonLd(
    parts.map((p) => `${BASE_URL}/dily/${p.slug}`),
  );

  const organizationJsonLd = generateOrganizationJsonLd();

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: storeJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationJsonLd }} />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-orange-500 no-underline text-gray-500">
                Domů
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-gray-300">›</span>
              <Link href="/dily" className="hover:text-orange-500 no-underline text-gray-500">
                Díly
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-gray-300">›</span>
              <span className="text-gray-900 font-medium">{partner.name}</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Header card */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Logo */}
            <div className="relative w-28 h-28 md:w-32 md:h-32 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {partner.logo ? (
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  sizes="(max-width: 768px) 112px, 128px"
                  className="object-cover"
                />
              ) : (
                <span className="text-4xl text-gray-300">🏭</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="verified">Ověřené vrakoviště</Badge>
                {partner.score > 0 && (
                  <Badge variant="default">Skóre {partner.score}</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                {partner.name}
              </h1>
              <p className="text-base text-gray-500 mt-2">
                Region: <span className="font-semibold text-gray-700">{regionLabel}</span>
                {" · "}
                Aktivních dílů: <span className="font-semibold text-gray-700">{partsCount}</span>
                {partner.googleRating && (
                  <>
                    {" · "}
                    Hodnocení: <span className="font-semibold text-gray-700">{partner.googleRating}/5</span>
                    {partner.googleReviewCount && ` (${partner.googleReviewCount} recenzí)`}
                  </>
                )}
              </p>
              {partner.description && (
                <p className="text-gray-600 mt-3 max-w-3xl">{partner.description}</p>
              )}

              {/* CTA — Kontakt */}
              <div className="flex flex-wrap gap-3 mt-5">
                {partner.phone && (
                  <a
                    href={`tel:${partner.phone}`}
                    className="inline-flex items-center gap-2 py-2.5 px-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold rounded-full shadow-orange hover:-translate-y-0.5 transition-all no-underline text-sm"
                  >
                    Zavolat: {partner.phone}
                  </a>
                )}
                {partner.email && (
                  <a
                    href={`mailto:${partner.email}`}
                    className="inline-flex items-center gap-2 py-2.5 px-5 bg-white border border-gray-200 text-gray-900 font-semibold rounded-full hover:border-orange-300 transition-all no-underline text-sm"
                  >
                    Email
                  </a>
                )}
                {partner.web && (
                  <a
                    href={partner.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 py-2.5 px-5 bg-white border border-gray-200 text-gray-900 font-semibold rounded-full hover:border-orange-300 transition-all no-underline text-sm"
                  >
                    Web
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parts grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {partsCount > 0 ? `Aktuální díly (${partsCount})` : "Aktuální díly"}
          </h2>
          {partsCount > parts.length && (
            <Link
              href={`/dily/katalog?supplier=${partner.id}`}
              className="text-sm font-semibold text-orange-500 hover:text-orange-600 no-underline"
            >
              Zobrazit vše →
            </Link>
          )}
        </div>

        {parts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">
              Vrakoviště zatím nemá publikované žádné díly. Zkuste se vrátit později nebo nás kontaktujte.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {parts.map((part) => (
              <ProductCard
                key={part.id}
                partId={part.id}
                name={part.name}
                compatibility={compatibilityLabel(part.compatibleBrands, part.compatibleModels)}
                condition={conditionToStars(part.condition)}
                price={part.price}
                badge={partTypeBadge(part.partType)}
                image={part.images[0]?.url}
                slug={part.slug}
                stock={part.stock}
                basePath="/dily"
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust strip */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">✅</div>
              <h3 className="font-bold text-gray-900 mb-1">Ověřené vrakoviště</h3>
              <p className="text-sm text-gray-500">Carmakler verifikuje každý dodavatel</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🚚</div>
              <h3 className="font-bold text-gray-900 mb-1">Doprava 2-5 dnů</h3>
              <p className="text-sm text-gray-500">Po celé ČR (Zásilkovna, PPL, DPD)</p>
            </div>
            <div>
              <div className="text-3xl mb-2">↩️</div>
              <h3 className="font-bold text-gray-900 mb-1">Záruka funkčnosti</h3>
              <p className="text-sm text-gray-500">3 měsíce na použité díly</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

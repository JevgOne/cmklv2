import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import { ServisReviewSection } from "@/components/web/autoservisy/ServisReviewSection";
import { pageCanonical } from "@/lib/canonical";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const servis = await prisma.autoServis.findUnique({ where: { slug } });
  if (!servis) return { title: "Servis nenalezen" };

  return {
    title: `${servis.name} — autoservis ${servis.city} | CarMakléř`,
    description: servis.description
      ? servis.description.slice(0, 160)
      : `${servis.name} — ${servis.city}. ${servis.reviewCount} recenzí, hodnocení ${servis.averageRating}★. Najděte ověřený autoservis na CarMakléř.`,
    alternates: pageCanonical(`/autoservisy/${slug}`),
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  mechanika: "Mechanické opravy",
  karosarna: "Karosářské práce",
  pneuservis: "Pneuservis",
  elektro: "Autoelektro",
  diagnostika: "Diagnostika",
  "stk-emise": "STK a emise",
  klimatizace: "Klimatizace",
  lakovna: "Lakování",
  tuning: "Tuning",
};

function Stars({ rating, size = "text-lg" }: { rating: number; size?: string }) {
  return (
    <span className={`text-orange-400 ${size}`}>
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

export default async function ServisDetailPage({ params }: Props) {
  const { slug } = await params;

  const servis = await prisma.autoServis.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!servis || !servis.isPublished) notFound();

  const openingHours = servis.openingHours
    ? (() => { try { return JSON.parse(servis.openingHours) as Array<{ day: string; hours: string }>; } catch { return []; } })()
    : [];

  const reviews = servis.reviews.map((r) => ({
    ...r,
    visitDate: r.visitDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: servis.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: servis.address,
      addressLocality: servis.city,
      addressRegion: servis.region,
      postalCode: servis.zip,
      addressCountry: "CZ",
    },
    telephone: servis.phone,
    url: servis.web,
    ...(servis.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: servis.averageRating,
        reviewCount: servis.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateBreadcrumbJsonLd([
            { name: "Domů", url: "https://carmakler.cz" },
            { name: "Autoservisy", url: "https://carmakler.cz/autoservisy" },
            { name: servis.name, url: `https://carmakler.cz/autoservisy/${slug}` },
          ]),
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs
          items={[
            { label: "Autoservisy", href: "/autoservisy" },
            { label: servis.name },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {servis.tier === "AUTORIZOVANY" && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
                    Autorizovaný servis
                  </span>
                )}
                {servis.isVerified && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700">
                    Ověřený CarMakléřem
                  </span>
                )}
                {servis.insurancePartner && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                    Spolupráce s pojišťovnami
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {servis.name}
              </h1>
              <p className="text-gray-500 mt-1">
                {servis.address ? `${servis.address}, ` : ""}
                {servis.city}
                {servis.zip ? ` ${servis.zip}` : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-2">
                <Stars rating={servis.averageRating} size="text-2xl" />
                <span className="text-2xl font-bold text-gray-900">
                  {servis.averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {servis.reviewCount} recenzí
                {servis.recommendRate > 0 && ` · ${servis.recommendRate}% doporučuje`}
              </p>
            </div>
          </div>

          {/* Contact buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            {servis.phone && (
              <a
                href={`tel:${servis.phone}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition"
              >
                Zavolat {servis.phone}
              </a>
            )}
            {servis.web && (
              <a
                href={servis.web.startsWith("http") ? servis.web : `https://${servis.web}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition"
              >
                Web
              </a>
            )}
            {servis.email && (
              <a
                href={`mailto:${servis.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition"
              >
                Email
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {servis.description && (
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">O servisu</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{servis.description}</p>
              </Card>
            )}

            {/* Categories */}
            {servis.categories.length > 0 && (
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Služby</h2>
                <div className="flex flex-wrap gap-2">
                  {servis.categories.map((cat) => (
                    <span key={cat} className="px-3 py-1 text-sm rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                      {CATEGORY_LABELS[cat] || cat}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Brands */}
            {servis.brands.length > 0 && (
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Značky</h2>
                <div className="flex flex-wrap gap-2">
                  {servis.brands.map((brand) => (
                    <span key={brand} className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">
                      {brand}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Insurance */}
            {servis.insurancePartner && servis.insuranceNames.length > 0 && (
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Spolupráce s pojišťovnami</h2>
                <div className="flex flex-wrap gap-2">
                  {servis.insuranceNames.map((name) => (
                    <span key={name} className="px-3 py-1 text-sm rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {name}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Reviews section */}
            <ServisReviewSection
              servisId={servis.id}
              servisName={servis.name}
              initialReviews={reviews}
              totalReviews={servis.reviewCount}
            />
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Opening hours */}
            {openingHours.length > 0 && (
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Otevírací doba</h2>
                <dl className="space-y-1.5 text-sm">
                  {openingHours.map((oh: { day: string; hours: string }, i: number) => (
                    <div key={i} className="flex justify-between">
                      <dt className="text-gray-500">{oh.day}</dt>
                      <dd className="font-medium text-gray-900">{oh.hours}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}

            {/* Map link */}
            {servis.latitude && servis.longitude && (
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Mapa</h2>
                <a
                  href={`https://maps.google.com/?q=${servis.latitude},${servis.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
                >
                  Otevřít v Google Maps
                </a>
              </Card>
            )}

            {/* Cross-linking */}
            <Card className="p-6 bg-orange-50 border-orange-200">
              <h2 className="text-sm font-semibold text-orange-700 uppercase mb-2">Hledáte auto?</h2>
              <p className="text-sm text-gray-600 mb-3">
                Podívejte se na nabídku vozidel v {servis.city} na CarMakléř.
              </p>
              <Link
                href="/nabidka"
                className="block text-center px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
              >
                Prohlédnout nabídku
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

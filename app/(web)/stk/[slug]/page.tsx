import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import { ServisReviewSection } from "@/components/web/autoservisy/ServisReviewSection";
import { StkInfoCard } from "@/components/web/StkInfoCard";
import { StkPriceCalc } from "@/components/web/StkPriceCalc";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const servis = await prisma.autoServis.findUnique({ where: { slug } });
  if (!servis) return { title: "STK stanice nenalezena" };

  return {
    title: `${servis.name} — STK stanice ${servis.city} | CarMakléř`,
    description: `${servis.name} — STK stanice ${servis.city}. ${servis.reviewCount} recenzí, hodnocení ${servis.averageRating}★${servis.stkWaitDays != null ? `, čekací doba ${servis.stkWaitDays} dní` : ""}. Najděte ověřenou STK stanici na CarMakléř.`,
  };
}

function Stars({ rating, size = "text-lg" }: { rating: number; size?: string }) {
  return (
    <span className={`text-orange-400 ${size}`}>
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

export default async function StkDetailPage({ params }: Props) {
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

  if (!servis || !servis.isPublished || !servis.categories.includes("stk-emise")) {
    notFound();
  }

  const reviews = servis.reviews.map((r) => ({
    ...r,
    visitDate: r.visitDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    additionalType: "STK",
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs
          items={[
            { label: "STK stanice", href: "/stk" },
            { label: servis.name },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                  STK stanice
                </span>
                {servis.isVerified && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700">
                    Ověřená CarMakléřem
                  </span>
                )}
                {servis.stkOnlineBooking && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-700">
                    Online rezervace
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {servis.description && (
              <Card className="p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">O stanici</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{servis.description}</p>
              </Card>
            )}

            {/* Reviews section */}
            <ServisReviewSection
              servisId={servis.id}
              servisName={servis.name}
              initialReviews={reviews}
              totalReviews={servis.reviewCount}
              isStk
            />
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* STK info */}
            {(
              <StkInfoCard
                stkLines={servis.stkLines}
                stkWaitDays={servis.stkWaitDays}
                stkOnlineBooking={servis.stkOnlineBooking}
                stkEmissions={servis.stkEmissions}
                stkMotorcycles={servis.stkMotorcycles}
                stkTrailers={servis.stkTrailers}
                stkHeavy={servis.stkHeavy}
              />
            )}

            {/* STK price calculator */}
            <StkPriceCalc />

            {/* Opening hours */}
            {servis.openingHours && (() => {
              try {
                const hours = JSON.parse(servis.openingHours) as Array<{ day: string; hours: string }>;
                if (hours.length === 0) return null;
                return (
                  <Card className="p-6">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Otevírací doba</h2>
                    <dl className="space-y-1.5 text-sm">
                      {hours.map((oh, i) => (
                        <div key={i} className="flex justify-between">
                          <dt className="text-gray-500">{oh.day}</dt>
                          <dd className="font-medium text-gray-900">{oh.hours}</dd>
                        </div>
                      ))}
                    </dl>
                  </Card>
                );
              } catch {
                return null;
              }
            })()}

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
              <h2 className="text-sm font-semibold text-orange-700 uppercase mb-2">Hledáte autoservis?</h2>
              <p className="text-sm text-gray-600 mb-3">
                Podívejte se na všechny autoservisy v {servis.city}.
              </p>
              <Link
                href="/autoservisy"
                className="block text-center px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
              >
                Všechny autoservisy
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

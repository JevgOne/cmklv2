import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";
import { pageCanonical } from "@/lib/canonical";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { BASE_URL } from "@/lib/seo-data";

export const revalidate = 3600;

const CATEGORY_LABELS: Record<string, string> = {
  mechanika: "Mechanické opravy",
  karosarna: "Karosářské práce",
  pneuservis: "Pneuservis",
  elektro: "Autoelektro",
  diagnostika: "Diagnostika",
  "stk-emise": "STK a emise",
  klimatizace: "Klimatizace",
  lakovna: "Lakování",
};

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const cityName = decodeURIComponent(city);
  const capitalized = cityName.charAt(0).toUpperCase() + cityName.slice(1);

  return {
    title: `Autoservisy ${capitalized} — ověřené recenze | Carmakler`,
    description: `Seznam autoservisů v ${capitalized} s recenzemi od skutečných zákazníků. Najděte ověřený autoservis, porovnejte hodnocení a ceny.`,
    alternates: pageCanonical(`/autoservisy/mesto/${city}`),
  };
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-orange-400">
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(5 - Math.round(rating))}
    </span>
  );
}

export default async function AutoservisyCityPage({ params }: Props) {
  const { city } = await params;
  const cityName = decodeURIComponent(city);

  const servisy = await prisma.autoServis.findMany({
    where: {
      isPublished: true,
      city: { equals: cityName, mode: "insensitive" },
    },
    orderBy: [
      { isFeatured: "desc" },
      { averageRating: "desc" },
    ],
  });

  const capitalized = cityName.charAt(0).toUpperCase() + cityName.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `Autoservisy ${capitalized}`,
            numberOfItems: servisy.length,
            itemListElement: servisy.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${BASE_URL}/autoservisy/${s.slug}`,
              name: s.name,
              item: {
                "@type": "AutoRepair",
                name: s.name,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: s.city,
                  ...(s.address && { streetAddress: s.address }),
                  addressCountry: "CZ",
                },
                ...(s.averageRating > 0 && {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: s.averageRating,
                    reviewCount: s.reviewCount,
                  },
                }),
              },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateBreadcrumbJsonLd([
            { name: "Domů", url: BASE_URL },
            { name: "Autoservisy", url: `${BASE_URL}/autoservisy` },
            { name: capitalized, url: `${BASE_URL}/autoservisy/mesto/${city}` },
          ]),
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Autoservisy", href: "/autoservisy" },
          { label: capitalized },
        ]}
      />

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
        Autoservisy {capitalized}
      </h1>
      <p className="text-gray-500 mb-8">
        {servisy.length > 0
          ? `${servisy.length} ${servisy.length === 1 ? "autoservis" : servisy.length < 5 ? "autoservisy" : "autoservisů"} v ${capitalized}`
          : `V ${capitalized} jsme zatím nenašli žádný autoservis`}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servisy.length > 0 ? (
          servisy.map((s) => (
            <Link key={s.id} href={`/autoservisy/${s.slug}`} className="no-underline">
              <Card hover className="p-6 h-full">
                <div className="flex items-center gap-2 mb-1">
                  {s.tier === "AUTORIZOVANY" && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700">
                      Autorizovaný
                    </span>
                  )}
                  {s.isVerified && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700">
                      Ověřený
                    </span>
                  )}
                  {s.insurancePartner && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">
                      Pojišťovny
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 truncate">{s.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{s.address || s.city}</p>
                {s.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {s.categories.slice(0, 3).map((cat) => (
                      <span key={cat} className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">
                        {CATEGORY_LABELS[cat] || cat}
                      </span>
                    ))}
                    {s.categories.length > 3 && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">
                        +{s.categories.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Stars rating={s.averageRating} />
                  <span className="font-bold text-gray-900">
                    {s.averageRating > 0 ? s.averageRating.toFixed(1) : "—"}
                  </span>
                  <span className="text-xs text-gray-500">({s.reviewCount} recenzí)</span>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Žádné autoservisy</h3>
            <p className="text-sm text-gray-500 mb-4">
              V {capitalized} jsme zatím nenašli žádný autoservis.
            </p>
            <Link
              href="/autoservisy"
              className="text-orange-500 font-medium hover:underline"
            >
              Zobrazit všechny autoservisy
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

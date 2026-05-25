import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";
import { pageCanonical } from "@/lib/canonical";
import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { BASE_URL } from "@/lib/seo-data";

export const revalidate = 3600;

const REGIONS: Record<string, string> = {
  praha: "Hlavní město Praha",
  stredocesky: "Středočeský",
  jihocesky: "Jihočeský",
  plzensky: "Plzeňský",
  karlovarsky: "Karlovarský",
  ustecky: "Ústecký",
  liberecky: "Liberecký",
  kralovehradecky: "Královéhradecký",
  pardubicky: "Pardubický",
  vysocina: "Vysočina",
  jihomoravsky: "Jihomoravský",
  olomoucky: "Olomoucký",
  zlinsky: "Zlínský",
  moravskoslezsky: "Moravskoslezský",
};

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
  params: Promise<{ kraj: string }>;
}

export function generateStaticParams() {
  return Object.keys(REGIONS).map((kraj) => ({ kraj }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kraj } = await params;
  const regionName = REGIONS[kraj];
  if (!regionName) return { title: "Kraj nenalezen" };

  const title = kraj === "praha"
    ? "Autoservisy Praha | Carmakler"
    : `Autoservisy ${regionName} kraj | Carmakler`;

  return {
    title,
    description: `Ověřené autoservisy v ${regionName === "Hlavní město Praha" ? "Praze" : `${regionName} kraji`} s recenzemi od skutečných zákazníků. Autorizované i nezávislé servisy, hodnocení kvality a cen.`,
    alternates: pageCanonical(`/autoservisy/kraj/${kraj}`),
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

export default async function AutoservisyKrajPage({ params }: Props) {
  const { kraj } = await params;
  const regionName = REGIONS[kraj];

  if (!regionName) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  const servisy = await prisma.autoServis.findMany({
    where: {
      isPublished: true,
      region: regionName,
    },
    orderBy: [
      { isFeatured: "desc" },
      { averageRating: "desc" },
    ],
  });

  const displayName = regionName === "Hlavní město Praha" ? "Praha" : `${regionName} kraj`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `Autoservisy ${displayName}`,
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
            { name: displayName, url: `${BASE_URL}/autoservisy/kraj/${kraj}` },
          ]),
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Autoservisy", href: "/autoservisy" },
          { label: displayName },
        ]}
      />

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
        Autoservisy — {displayName}
      </h1>
      <p className="text-gray-500 mb-8">
        {servisy.length > 0
          ? `${servisy.length} ${servisy.length === 1 ? "autoservis" : servisy.length < 5 ? "autoservisy" : "autoservisů"} v regionu ${displayName}`
          : `V regionu ${displayName} jsme zatím nenašli žádný autoservis`}
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
              V regionu {displayName} jsme zatím nenašli žádný autoservis.
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

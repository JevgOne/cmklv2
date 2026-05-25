import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import { StkPriceCalc } from "@/components/web/StkPriceCalc";
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
    ? "STK stanice Praha | Carmakler"
    : `STK stanice ${regionName} kraj | Carmakler`;

  return {
    title,
    description: `Seznam STK stanic v ${regionName === "Hlavní město Praha" ? "Praze" : `${regionName} kraji`} s recenzemi a hodnocením. Najděte nejbližší STK stanici, zjistěte čekací doby a objednejte se online.`,
    alternates: pageCanonical(`/stk/kraj/${kraj}`),
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

export default async function StkKrajPage({ params }: Props) {
  const { kraj } = await params;
  const regionName = REGIONS[kraj];

  if (!regionName) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  const servisy = await prisma.autoServis.findMany({
    where: {
      isPublished: true,
      categories: { has: "stk-emise" },
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
            name: `STK stanice ${displayName}`,
            numberOfItems: servisy.length,
            itemListElement: servisy.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${BASE_URL}/stk/${s.slug}`,
              name: s.name,
              item: {
                "@type": "LocalBusiness",
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
            { name: "STK stanice", url: `${BASE_URL}/stk` },
            { name: displayName, url: `${BASE_URL}/stk/kraj/${kraj}` },
          ]),
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "STK stanice", href: "/stk" },
          { label: displayName },
        ]}
      />

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
        STK stanice — {displayName}
      </h1>
      <p className="text-gray-500 mb-8">
        {servisy.length > 0
          ? `${servisy.length} STK ${servisy.length === 1 ? "stanice" : servisy.length < 5 ? "stanice" : "stanic"} v regionu ${displayName}`
          : `V regionu ${displayName} jsme zatím nenašli žádnou STK stanici`}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {servisy.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {servisy.map((s) => (
                <Link key={s.id} href={`/stk/${s.slug}`} className="no-underline">
                  <Card hover className="p-6 h-full">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">
                        STK
                      </span>
                      {s.isVerified && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-700">
                          Ověřená
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 truncate">{s.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{s.address || s.city}</p>
                    <div className="flex items-center gap-2">
                      <Stars rating={s.averageRating} />
                      <span className="font-bold text-gray-900">
                        {s.averageRating > 0 ? s.averageRating.toFixed(1) : "—"}
                      </span>
                      <span className="text-xs text-gray-500">({s.reviewCount} recenzí)</span>
                    </div>
                    {s.stkWaitDays != null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Čekací doba: ~{s.stkWaitDays} {s.stkWaitDays === 1 ? "den" : s.stkWaitDays < 5 ? "dny" : "dní"}
                      </p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Žádné STK stanice</h3>
              <p className="text-sm text-gray-500 mb-4">
                V regionu {displayName} jsme zatím nenašli žádnou STK stanici.
              </p>
              <Link
                href="/stk"
                className="text-orange-500 font-medium hover:underline"
              >
                Zobrazit všechny STK stanice
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <StkPriceCalc />
        </div>
      </div>
    </div>
  );
}

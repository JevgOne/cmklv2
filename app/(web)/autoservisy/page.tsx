import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { ServisyList } from "@/components/web/autoservisy/ServisyList";
import { MapListView } from "@/components/web/map/MapListView";
import { generateFaqJsonLd } from "@/lib/seo";
import { pageCanonical } from "@/lib/canonical";

export const revalidate = 3600; // 1h — catalog page
import type { Metadata } from "next";
import type { MapMarker } from "@/lib/map-config";

const AUTOSERVISY_FAQ = [
  { question: "Jak vybrat spolehlivý autoservis?", answer: "Podívejte se na recenze od skutečných zákazníků, ověřte specializaci servisu na váš typ vozidla a zkontrolujte, zda servis spolupracuje s pojišťovnami. Na CarMakléř najdete hodnocení kvality, ceny, rychlosti a komunikace." },
  { question: "Kolik stojí servis auta?", answer: "Cena závisí na typu opravy a značce vozu. Běžný servis (výměna oleje, filtrů) stojí 2 000–5 000 Kč. Větší opravy (brzdy, rozvodový řemen) 5 000–20 000 Kč. Doporučujeme porovnat nabídky více servisů." },
  { question: "Jaký je rozdíl mezi autorizovaným a nezávislým servisem?", answer: "Autorizovaný servis je certifikovaný výrobcem vozu, používá originální díly a zachovává záruku. Nezávislý servis bývá cenově výhodnější a může používat kvalitní aftermarket díly. Pro záruční vozy doporučujeme autorizovaný servis." },
];

export const metadata: Metadata = {
  title: "Autoservisy — ověřené recenze",
  description:
    "Najděte ověřený autoservis s reálnými recenzemi. Autorizované i nezávislé servisy, spolupráce s pojišťovnami. Hodnocení od skutečných zákazníků.",
  alternates: pageCanonical("/autoservisy"),
};

const CATEGORY_OPTIONS = [
  { value: "", label: "Všechny kategorie" },
  { value: "mechanika", label: "Mechanické opravy" },
  { value: "karosarna", label: "Karosářské práce" },
  { value: "pneuservis", label: "Pneuservis" },
  { value: "elektro", label: "Autoelektro" },
  { value: "diagnostika", label: "Diagnostika" },
  { value: "stk-emise", label: "STK a emise" },
  { value: "klimatizace", label: "Klimatizace" },
  { value: "lakovna", label: "Lakování" },
];

export default async function AutoservisyPage() {
  const [servisy, totalCount, cities] = await Promise.all([
    prisma.autoServis.findMany({
      where: { isPublished: true },
      orderBy: [{ isFeatured: "desc" }, { averageRating: "desc" }, { reviewCount: "desc" }],
      take: 50,
    }),
    prisma.autoServis.count({ where: { isPublished: true } }),
    prisma.autoServis.findMany({
      where: { isPublished: true },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
  ]);

  const serialized = servisy.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const mapMarkers: MapMarker[] = servisy
    .filter((s) => s.latitude && s.longitude)
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      lat: s.latitude!,
      lng: s.longitude!,
      name: s.name,
      city: s.city,
      rating: s.averageRating,
      reviewCount: s.reviewCount,
      phone: s.phone || undefined,
      categories: s.categories,
      type: s.categories.includes("stk-emise") ? "stk" as const : "servis" as const,
    }));

  const cityOptions = [
    { value: "", label: "Všechna města" },
    ...cities.map((c) => ({ value: c.city, label: c.city })),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateFaqJsonLd(AUTOSERVISY_FAQ) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: "Domů", href: "/" }, { label: "Autoservisy" }]} />

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Najděte ověřený <span className="text-orange-500">autoservis</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {totalCount} servisů s reálnými recenzemi od zákazníků. Autorizované i nezávislé dílny.
          </p>
        </div>

        {/* Map */}
        {mapMarkers.length > 0 && (
          <div className="mb-12">
            <MapListView markers={mapMarkers} type="servis" />
          </div>
        )}

        {/* Full list with filters */}
        <ServisyList
          initialServisy={serialized}
          totalCount={totalCount}
          cityOptions={cityOptions}
          categoryOptions={CATEGORY_OPTIONS}
        />
      </div>
    </>
  );
}

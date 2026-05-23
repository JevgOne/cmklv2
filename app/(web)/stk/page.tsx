import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { StkPriceTable } from "@/components/web/StkPriceTable";
import { StkPriceCalc } from "@/components/web/StkPriceCalc";
import { MapListView } from "@/components/web/map/MapListView";
import { generateFaqJsonLd } from "@/lib/seo";

export const revalidate = 3600; // 1h — catalog page
import { pageCanonical } from "@/lib/canonical";
import type { Metadata } from "next";
import type { MapMarker } from "@/lib/map-config";

const STK_FAQ = [
  { question: "Kolik stojí STK?", answer: "Cena STK pro osobní automobil (kategorie M1) je 800 Kč za technickou prohlídku a 400 Kč za měření emisí, celkem 1 200 Kč. Ceny se liší podle kategorie vozidla." },
  { question: "Jak často musím na STK?", answer: "Nové osobní auto má první STK po 4 letech, poté každé 2 roky. Vozidla starší 10 let musí na STK každý rok. Užitková vozidla nad 3,5 t každý rok." },
  { question: "Co potřebuji k STK?", answer: "Na STK potřebujete velký technický průkaz (osvědčení o registraci vozidla), malý technický průkaz a platné povinné ručení. Vozidlo musí být čisté a bez zjevných závad." },
  { question: "Co se kontroluje při STK?", answer: "Kontroluje se stav brzd, řízení, náprav, kol, osvětlení, karoserie, podvozku, výfukového systému a dalších bezpečnostních prvků. Součástí je i měření emisí." },
];

export const metadata: Metadata = {
  title: "STK stanice — najděte nejbližší stanici technické kontroly",
  description:
    "Seznam STK stanic v ČR s recenzemi, čekacími dobami a cenami. Najděte nejbližší STK stanici a objednejte se online.",
  alternates: pageCanonical("/stk"),
};

export default async function StkListPage() {
  const servisy = await prisma.autoServis.findMany({
    where: {
      isPublished: true,
      categories: { has: "stk-emise" },
    },
    orderBy: [
      { isFeatured: "desc" },
      { averageRating: "desc" },
    ],
  });

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
      type: "stk" as const,
    }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: generateFaqJsonLd(STK_FAQ) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: "Domů", href: "/" }, { label: "STK stanice" }]} />

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
          STK stanice v České republice
        </h1>
        <p className="text-gray-500 mb-8">
          {mapMarkers.length > 0
            ? `${mapMarkers.length} stanic na mapě — najděte nejbližší STK s recenzemi a hodnocením`
            : "Najděte nejbližší stanici technické kontroly s recenzemi a hodnocením"}
        </p>

        {/* Map + List */}
        {mapMarkers.length > 0 && (
          <div className="mb-12">
            <MapListView markers={mapMarkers} type="stk" />
          </div>
        )}

        {/* Price calculator + table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StkPriceCalc />
          <StkPriceTable />
        </div>
      </div>
    </>
  );
}

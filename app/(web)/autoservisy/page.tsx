import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { ServisyList } from "@/components/web/autoservisy/ServisyList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autoservisy — ověřené recenze | CarMakléř",
  description:
    "Najděte ověřený autoservis s reálnými recenzemi. Autorizované i nezávislé servisy, spolupráce s pojišťovnami. Hodnocení od skutečných zákazníků.",
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
      take: 20,
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

  const cityOptions = [
    { value: "", label: "Všechna města" },
    ...cities.map((c) => ({ value: c.city, label: c.city })),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Breadcrumbs items={[{ label: "Autoservisy" }]} />

      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          Najděte ověřený <span className="text-orange-500">autoservis</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {totalCount} servisů s reálnými recenzemi od zákazníků. Autorizované i nezávislé dílny.
        </p>
      </div>

      <ServisyList
        initialServisy={serialized}
        totalCount={totalCount}
        cityOptions={cityOptions}
        categoryOptions={CATEGORY_OPTIONS}
      />
    </div>
  );
}

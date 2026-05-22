import { prisma } from "@/lib/prisma";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { StkPriceTable } from "@/components/web/StkPriceTable";
import { StkPriceCalc } from "@/components/web/StkPriceCalc";
import { ServisyList } from "@/components/web/autoservisy/ServisyList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "STK stanice — najděte nejbližší stanici technické kontroly | CarMakléř",
  description:
    "Seznam STK stanic v ČR s recenzemi, čekacími dobami a cenami. Najděte nejbližší STK stanici a objednejte se online.",
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

  const serialized = servisy.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    city: s.city,
    categories: s.categories,
    averageRating: s.averageRating,
    reviewCount: s.reviewCount,
    recommendRate: s.recommendRate,
    tier: s.tier,
    insurancePartner: s.insurancePartner,
    insuranceNames: s.insuranceNames,
    isVerified: s.isVerified,
    logo: s.logo,
  }));

  const cities = [...new Set(servisy.map((s) => s.city))].sort();
  const cityOptions = [
    { value: "", label: "Všechna města" },
    ...cities.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Breadcrumbs items={[{ label: "STK stanice" }]} />

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
        STK stanice
      </h1>
      <p className="text-gray-500 mb-8">
        Najděte nejbližší stanici technické kontroly s recenzemi a hodnocením
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ServisyList
            initialServisy={serialized}
            totalCount={serialized.length}
            cityOptions={cityOptions}
            categoryOptions={[]}
          />
        </div>

        <div className="space-y-6">
          <StkPriceCalc />
          <StkPriceTable />
        </div>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import { StkPriceCalc } from "@/components/web/StkPriceCalc";
import type { Metadata } from "next";

export const revalidate = 600; // 10min — detail page

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const cityName = decodeURIComponent(city);
  const capitalized = cityName.charAt(0).toUpperCase() + cityName.slice(1);

  return {
    title: `STK stanice ${capitalized} — kde na STK v ${capitalized}`,
    description: `Seznam STK stanic v ${capitalized} s recenzemi a hodnocením. Najděte nejbližší STK stanici, zjistěte čekací doby a objednejte se online.`,
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

export default async function StkCityPage({ params }: Props) {
  const { city } = await params;
  const cityName = decodeURIComponent(city);

  const servisy = await prisma.autoServis.findMany({
    where: {
      isPublished: true,
      categories: { has: "stk-emise" },
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
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "STK stanice", href: "/stk" },
          { label: capitalized },
        ]}
      />

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
        STK stanice {capitalized}
      </h1>
      <p className="text-gray-500 mb-8">
        {servisy.length > 0
          ? `${servisy.length} STK ${servisy.length === 1 ? "stanice" : servisy.length < 5 ? "stanice" : "stanic"} v ${capitalized}`
          : `V ${capitalized} jsme zatím nenašli žádnou STK stanici`}
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
                V {capitalized} jsme zatím nenašli žádnou STK stanici.
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

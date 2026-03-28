import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Inzerce — vložte inzerát zdarma",
  description:
    "Vložte inzerát na prodej auta zdarma za minutu. Bez registrace, bez poplatků. Vaše auto uvidí tisíce kupujících denně.",
  openGraph: {
    title: "Inzerce zdarma | CarMakléř",
    description:
      "Prodejte své auto online. Vložte inzerát za minutu, zcela zdarma.",
  },
};

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

const steps = [
  {
    icon: "📸",
    title: "Nafoťte auto",
    desc: "Stačí pár fotek z mobilu",
  },
  {
    icon: "📝",
    title: "Vyplňte údaje",
    desc: "Značka, model, cena — to je vše",
  },
  {
    icon: "✅",
    title: "Inzerát je online",
    desc: "Během minuty viditelný pro tisíce lidí",
  },
];

const benefits = [
  {
    icon: "💰",
    title: "Zcela zdarma",
    desc: "Žádné poplatky, žádné skryté náklady",
  },
  {
    icon: "👁",
    title: "Tisíce kupujících",
    desc: "Vaše auto uvidí tisíce lidí denně",
  },
  {
    icon: "⚡",
    title: "Za minutu online",
    desc: "Žádné zdlouhavé formuláře",
  },
  {
    icon: "📱",
    title: "Jednoduše z mobilu",
    desc: "Nafoťte a vložte odkudkoliv",
  },
];

const fuelLabels: Record<string, string> = {
  PETROL: "Benzín", DIESEL: "Diesel", ELECTRIC: "Elektro", HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in Hybrid", LPG: "LPG", CNG: "CNG",
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default async function InzercePage() {
  // Fetch real stats and recent listings from DB
  let listingCount = 0;
  let totalViews = 0;
  let soldCount = 0;
  let recentListings: { id: string; title: string; year: number; km: string; fuel: string; price: string; city: string; photo: string; slug: string }[] = [];

  try {
    const [count, dbListings, viewsResult, sold] = await Promise.all([
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.listing.findMany({
        where: { status: "ACTIVE" },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.listing.aggregate({ where: { status: "ACTIVE" }, _sum: { viewCount: true } }),
      prisma.listing.count({ where: { status: "SOLD" } }),
    ]);

    listingCount = count;
    totalViews = viewsResult._sum.viewCount || 0;
    soldCount = sold;
    recentListings = dbListings.map((l) => ({
      id: l.id,
      title: `${l.brand} ${l.model}${l.variant ? " " + l.variant : ""}`,
      year: l.year,
      km: new Intl.NumberFormat("cs-CZ").format(l.mileage) + " km",
      fuel: fuelLabels[l.fuelType] || l.fuelType,
      price: new Intl.NumberFormat("cs-CZ").format(l.price),
      city: l.city,
      photo: l.images[0]?.url || "/images/placeholder-car.jpg",
      slug: l.slug,
    }));
  } catch {
    /* DB unavailable */
  }

  return (
    <main className="min-h-screen">
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Inzerce vozidel zdarma" },
        ]}
      />
      {/* ============================================================ */}
      {/* Hero                                                          */}
      {/* ============================================================ */}
      <section className="bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-28 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Prodejte své auto.{" "}
            <span className="text-orange-500">Zdarma.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mt-5 max-w-2xl mx-auto leading-relaxed">
            Vložte inzerát za minutu. Bez registrace, bez poplatků.
          </p>
          <div className="mt-8">
            <Link href="/inzerce/pridat" className="no-underline">
              <Button variant="primary" size="lg">
                Vložit inzerát zdarma
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-5 flex items-center justify-center gap-4 flex-wrap">
            <span className="text-green-500 font-medium">&#10003; Zcela zdarma</span>
            <span className="text-green-500 font-medium">&#10003; Bez registrace</span>
            <span className="text-green-500 font-medium">&#10003; Online za 60 sekund</span>
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Stats strip                                                   */}
      {/* ============================================================ */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center">
            <div>
              <span className="text-2xl font-extrabold text-gray-900">{listingCount}</span>
              <span className="text-sm text-gray-500 ml-2">aktivních inzerátů</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200" />
            <div>
              <span className="text-2xl font-extrabold text-gray-900">{totalViews.toLocaleString("cs-CZ")}</span>
              <span className="text-sm text-gray-500 ml-2">zobrazení celkem</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-gray-200" />
            <div>
              <span className="text-2xl font-extrabold text-gray-900">{soldCount}</span>
              <span className="text-sm text-gray-500 ml-2">prodaných vozidel</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Prohlédněte si nabídku                                       */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Prohlédněte si nabídku
            </h2>
            <p className="text-gray-500 mt-4 text-lg">
              <span className="font-bold text-orange-500">{listingCount}</span> vozidel od makléřů i soukromých prodejců
            </p>
            <div className="mt-8">
              <Link href="/nabidka" className="no-underline">
                <Button variant="primary" size="lg">
                  Zobrazit nabídku &rarr;
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Jak to funguje                                                */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Jak to funguje
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <Card key={step.title} hover className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-[32px] mx-auto">
                  {step.icon}
                </div>
                <div className="text-sm font-bold text-orange-500 mt-4">
                  Krok {index + 1}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {step.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Proč inzerovat u nás                                          */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Proč inzerovat u nás
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title} hover className="p-6 text-center">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-[28px] mx-auto">
                  {benefit.icon}
                </div>
                <h3 className="text-[16px] font-bold text-gray-900 mt-4">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {benefit.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Cenový přehled — 3 úrovně                                     */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Vyberte si úroveň
            </h2>
            <p className="text-gray-500 mt-3 text-lg">
              Každý typ prodejce má jiné potřeby
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Soukromý */}
            <Card hover className="p-8 relative">
              <div className="text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-[28px] mx-auto">
                  👤
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-4">Soukromý</h3>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-gray-900">Zdarma</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">1 aktivní inzerát / 60 dní</p>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-600 list-none p-0">
                <PricingRow included>1 inzerát zdarma</PricingRow>
                <PricingRow included>Platnost 60 dní</PricingRow>
                <PricingRow included>Základní statistiky</PricingRow>
                <PricingRow included>Dotazy přes platformu</PricingRow>
                <PricingRow>Zvýraznění TOP</PricingRow>
                <PricingRow>Prioritní podpora</PricingRow>
              </ul>
              <div className="mt-8">
                <Link href="/inzerce/registrace" className="no-underline block">
                  <Button variant="outline" size="lg" className="w-full">
                    Zaregistrovat se
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Bazar */}
            <Card hover className="p-8 relative ring-2 ring-orange-500">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Nejoblíbenější
                </span>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-[28px] mx-auto">
                  🏪
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-4">Bazar</h3>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-gray-900">Zdarma</span>
                  <span className="text-sm text-gray-500 ml-1">do 10 inzerátů</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Vyžaduje IČO</p>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-600 list-none p-0">
                <PricingRow included>10 inzerátů zdarma</PricingRow>
                <PricingRow included>Platnost 90 dní</PricingRow>
                <PricingRow included>Detailní statistiky</PricingRow>
                <PricingRow included>Dotazy přes platformu</PricingRow>
                <PricingRow included>Zvýraznění TOP (199 Kč)</PricingRow>
                <PricingRow>Prioritní podpora</PricingRow>
              </ul>
              <div className="mt-8">
                <Link href="/inzerce/registrace" className="no-underline block">
                  <Button variant="primary" size="lg" className="w-full">
                    Zaregistrovat se
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Dealer */}
            <Card hover className="p-8 relative">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-[28px] mx-auto">
                  🏢
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-4">Dealer</h3>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-gray-900">Na míru</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Autorizovaný prodejce</p>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-600 list-none p-0">
                <PricingRow included>Neomezené inzeráty</PricingRow>
                <PricingRow included>Neomezená platnost</PricingRow>
                <PricingRow included>Detailní statistiky</PricingRow>
                <PricingRow included>Dotazy přes platformu</PricingRow>
                <PricingRow included>Zvýraznění TOP zdarma</PricingRow>
                <PricingRow included>Prioritní podpora</PricingRow>
              </ul>
              <div className="mt-8">
                <Link href="/kontakt" className="no-underline block">
                  <Button variant="secondary" size="lg" className="w-full">
                    Kontaktovat nás
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Nejnovější inzeráty                                           */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Nejnovější inzeráty
            </h2>
          </div>

          {recentListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {recentListings.map((listing) => (
              <Link key={listing.id} href={`/nabidka/${listing.slug}`} className="no-underline block">
                <Card hover className="group">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={listing.photo}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-[17px] font-bold text-gray-900 truncate">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {listing.year} &middot; {listing.km} &middot; {listing.fuel}
                    </p>
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="text-[22px] font-extrabold text-gray-900">
                        {listing.price}{" "}
                        <span className="text-sm font-medium text-gray-400">
                          Kč
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{listing.city}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          ) : (
            <p className="text-center text-gray-400 py-8">
              Zatím nejsou k dispozici žádné inzeráty. Buďte první!
            </p>
          )}

          <div className="text-center mt-10">
            <Link
              href="/nabidka"
              className="text-orange-500 hover:text-orange-600 font-semibold no-underline transition-colors"
            >
              Zobrazit všechny inzeráty &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Bottom CTA                                                    */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-gray-900 to-gray-950">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Máte auto na prodej?
            </h2>
            <p className="text-white/60 mt-4 text-lg">
              Vložte inzerát zdarma a prodejte ho tisícům kupujících.
            </p>
            <div className="mt-8">
              <Link href="/inzerce/pridat" className="no-underline">
                <Button variant="primary" size="lg">
                  Vložit inzerát zdarma
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

function PricingRow({
  included = false,
  children,
}: {
  included?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      {included ? (
        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs shrink-0">
          ✓
        </span>
      ) : (
        <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs shrink-0">
          —
        </span>
      )}
      <span className={included ? "text-gray-700" : "text-gray-400"}>
        {children}
      </span>
    </li>
  );
}

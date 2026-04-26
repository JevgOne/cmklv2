import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { prisma } from "@/lib/prisma";
import { generateItemListJsonLd } from "@/lib/seo";
import { pageCanonical } from "@/lib/canonical";

export const revalidate = 3600; // ISR: 1 hodina

export const metadata: Metadata = {
  title: "Ověření automakléři po celé ČR",
  description:
    "Najděte makléře ve vašem městě. Každý prošel školením, má reálné prodeje a hodnocení od klientů. Prodej auta bez starostí.",
  openGraph: {
    title: "Ověření automakléři po celé ČR | CarMakléř",
    description:
      "Najděte makléře ve vašem městě. Reálné prodeje, hodnocení od klientů, školení. Prodej auta bez starostí.",
  },
  alternates: pageCanonical("/makleri"),
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const levelBadges: Record<string, { variant: "top" | "default" | "verified"; label: string }[]> = {
  STAR_5: [
    { variant: "top", label: "TOP Makléř" },
    { variant: "default", label: "Rychlá reakce" },
  ],
  STAR_4: [{ variant: "top", label: "TOP Makléř" }],
  STAR_3: [{ variant: "top", label: "TOP Makléř" }],
  STAR_2: [{ variant: "verified", label: "Ověřený" }],
  STAR_1: [{ variant: "verified", label: "Ověřený" }],
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function MakleriPage() {
  let brokers: {
    slug: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    cities: string | null;
    level: string;
    totalSales: number;
    trustScore: { score: number; tier: string } | null;
  }[] = [];
  let brokerCount = 0;

  try {
    const [count, dbBrokers] = await Promise.all([
      prisma.user.count({ where: { role: "BROKER", status: "ACTIVE" } }),
      prisma.user.findMany({
        where: { role: "BROKER", status: "ACTIVE", slug: { not: null } },
        select: {
          slug: true,
          firstName: true,
          lastName: true,
          avatar: true,
          cities: true,
          level: true,
          totalSales: true,
          trustScore: { select: { score: true, tier: true } },
        },
        orderBy: { totalSales: "desc" },
      }),
    ]);

    brokerCount = count;
    brokers = dbBrokers as typeof brokers;
  } catch {
    /* DB unavailable */
  }

  return (
    <main>
      {brokers.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateItemListJsonLd(
              brokers.map((b) => `https://carmakler.cz/profil/${b.slug}`)
            ),
          }}
        />
      )}
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Naši makléři" },
        ]}
      />
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 py-10 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Najděte makléře ve vašem městě
          </h1>
          <p className="text-white/60 mt-4 text-lg max-w-2xl mx-auto">
            {brokerCount} ověřených makléřů po celé ČR. Každý prošel školením, má reálné prodeje a hodnocení od klientů.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {brokers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {brokers.map((broker) => {
                const initials =
                  (broker.firstName?.[0] ?? "") + (broker.lastName?.[0] ?? "");
                const cities: string[] = broker.cities
                  ? (() => { try { return JSON.parse(broker.cities); } catch { return []; } })()
                  : [];
                const primaryCity = cities[0] || "ČR";
                const badges = levelBadges[broker.level] || levelBadges.STAR_1;

                return (
                  <Link
                    key={broker.slug}
                    href={`/profil/${broker.slug}`}
                    className="no-underline text-inherit"
                  >
                    <Card
                      hover
                      className="p-7 relative overflow-visible group h-full"
                    >
                      {/* Orange top bar on hover */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 rounded-t-2xl" />

                      <div className="flex items-center gap-4 mb-5">
                        {broker.avatar ? (
                          <img
                            src={broker.avatar}
                            alt={`${broker.firstName} ${broker.lastName}`}
                            className="w-[60px] h-[60px] rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-[60px] h-[60px] bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-[22px] font-extrabold text-white shrink-0">
                            {initials}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {broker.firstName} {broker.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {primaryCity}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap mb-5">
                        {badges.map((b, i) => (
                          <Badge key={i} variant={b.variant}>
                            {b.label}
                          </Badge>
                        ))}
                      </div>

                      <div className={`grid ${broker.trustScore && broker.trustScore.score > 0 ? "grid-cols-3" : "grid-cols-2"} gap-4 pt-5 border-t border-gray-100`}>
                        <div className="text-center">
                          <div className="text-2xl font-extrabold text-gray-900">
                            {broker.totalSales}
                          </div>
                          <div className="text-[11px] font-semibold text-gray-500 mt-1">
                            Prodejů
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-extrabold bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent">
                            {"⭐".repeat(parseInt(broker.level?.replace("STAR_", "") || "1"))}
                          </div>
                          <div className="text-[11px] font-semibold text-gray-500 mt-1">
                            Úroveň
                          </div>
                        </div>
                        {broker.trustScore && broker.trustScore.score > 0 && (
                          <div className="text-center">
                            <div className={`text-2xl font-extrabold ${
                              broker.trustScore.score >= 75 ? "text-yellow-600" :
                              broker.trustScore.score >= 50 ? "text-slate-600" :
                              broker.trustScore.score >= 25 ? "text-amber-600" : "text-gray-500"
                            }`}>
                              {broker.trustScore.score}
                            </div>
                            <div className="text-[11px] font-semibold text-gray-500 mt-1">
                              Trust Score
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                👥
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Zatím nejsou k dispozici žádní makléři
              </h3>
              <p className="text-gray-500 mt-2">
                Brzy zde najdete naše ověřené makléře.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Cross-linking CTA */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-6">
            <Link href="/chci-prodat" className="no-underline block">
              <Card hover className="p-8 text-center h-full">
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                  Chcete prodat auto?
                </h2>
                <p className="text-sm text-gray-500">
                  Makléř zajistí fotky, inzerci, prohlídky i smlouvu. Vy jen podepíšete a inkasujete.
                </p>
                <span className="inline-block mt-4 text-orange-500 font-semibold text-sm">
                  Prodat auto přes makléře &rarr;
                </span>
              </Card>
            </Link>
            <Link href="/kariera" className="no-underline block">
              <Card hover className="p-8 text-center h-full">
                <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                  Chcete se stát makléřem?
                </h2>
                <p className="text-sm text-gray-500">
                  Flexibilní úvazek, vlastní tempo, výdělek bez stropu. Průměrný makléř vydělá 40–80 000 Kč měsíčně.
                </p>
                <span className="inline-block mt-4 text-orange-500 font-semibold text-sm">
                  Zjistit více o kariéře &rarr;
                </span>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

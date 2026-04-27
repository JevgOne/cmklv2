import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BrokerCard, type BrokerCardBroker } from "@/components/web/BrokerCard";
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
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function MakleriPage() {
  let brokers: BrokerCardBroker[] = [];
  let brokerCount = 0;

  try {
    const teamFilter = { status: "ACTIVE" as const, slug: { not: null }, role: { in: ["BROKER", "ADMIN", "MANAGER"] as string[] } };
    const [count, dbBrokers] = await Promise.all([
      prisma.user.count({ where: teamFilter }),
      prisma.user.findMany({
        where: teamFilter,
        select: {
          slug: true,
          firstName: true,
          lastName: true,
          avatar: true,
          level: true,
          jobTitle: true,
          city: true,
          cities: true,
          bio: true,
          totalSales: true,
          phone: true,
          showPhone: true,
          tags: { select: { slug: true, label: true } },
          trustScore: { select: { score: true, tier: true } },
          _count: { select: { vehicles: { where: { status: "ACTIVE" } } } },
        },
        orderBy: { totalSales: "desc" },
      }),
    ]);

    brokerCount = count;
    brokers = dbBrokers.map((b) => ({
      slug: b.slug || "makler",
      firstName: b.firstName,
      lastName: b.lastName,
      avatar: b.avatar,
      level: b.level,
      jobTitle: b.jobTitle,
      city: b.city,
      cities: b.cities
        ? (() => { try { return JSON.parse(b.cities); } catch { return []; } })()
        : [],
      bio: b.bio,
      totalSales: b.totalSales,
      activeVehicles: b._count.vehicles,
      phone: b.phone,
      showPhone: b.showPhone,
      tags: b.tags,
      trustScore: b.trustScore?.score ?? null,
      trustTier: b.trustScore?.tier ?? null,
    }));
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
              {brokers.map((broker) => (
                <BrokerCard key={broker.slug} broker={broker} />
              ))}
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

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageCanonical } from "@/lib/canonical";
import { BASE_URL } from "@/lib/seo-data";
import { formatPrice, formatRelativeCz, parseCities } from "@/lib/utils";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { LandingHero } from "@/components/web/LandingHero";
import { BrokerGrid, type BrokerGridExtra } from "@/components/web/BrokerGrid";
import { RelatedHashtags } from "@/components/web/RelatedHashtags";
import { FAQ } from "@/components/web/FAQ";
import { CTABlock } from "@/components/web/CTABlock";
import { CTABlockAuthAware } from "@/components/web/CTABlockAuthAware";
import {
  getHeroCopy,
  getFAQ,
  getSiblingSectionLabel,
  type TagCopyInput,
  type LandingStats,
} from "@/lib/landing-copy";
import { getRelatedTagsByCoOccurrence } from "@/lib/tags";
import { LEVEL_LABELS } from "@/lib/role-labels";

export const revalidate = 3600;

/** Landing stránky s < tímto počtem makléřů dostanou `noindex,follow`. */
const MIN_BROKERS_FOR_INDEX = 2;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const tag = await prisma.tag.findUnique({
    where: { slug },
    select: {
      slug: true,
      label: true,
      category: true,
      _count: { select: { users: { where: { role: "BROKER", status: "ACTIVE" } } } },
    },
  });

  if (!tag) {
    return { title: "Nenalezeno — Carmakléř" };
  }

  const count = tag._count.users;
  const copy = getHeroCopy(
    { slug: tag.slug, label: tag.label, category: tag.category },
    { count, totalSoldVehicles: 0, topLevelCount: 0, activeVehicles: 0 }
  );

  return {
    title: `${copy.h1} — Carmakléř`,
    description: copy.subheadline,
    alternates: pageCanonical(`/makleri/${slug}`),
    openGraph: {
      title: copy.h1,
      description: copy.subheadline,
    },
    robots:
      count < MIN_BROKERS_FOR_INDEX ? { index: false, follow: true } : undefined,
  };
}

async function fetchLandingData(slug: string) {
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      users: {
        where: { role: "BROKER", status: "ACTIVE", slug: { not: null } },
        select: {
          id: true,
          slug: true,
          firstName: true,
          lastName: true,
          avatar: true,
          level: true,
          city: true,
          cities: true,
          bio: true,
          totalSales: true,
          phone: true,
          showPhone: true,
          createdAt: true,
          tags: {
            select: { slug: true, label: true },
          },
        },
        orderBy: { totalSales: "desc" },
        take: 24,
      },
    },
  });

  if (!tag) return null;

  const brokerIds = tag.users.map((u) => u.id);
  const hasEnoughBrokersForCoOcc = tag.users.length >= 3;

  const relatedQuery = hasEnoughBrokersForCoOcc
    ? getRelatedTagsByCoOccurrence(tag.id, 6).then((rows) =>
        rows.map((r) => ({ slug: r.slug, label: r.label, shared: r.shared }))
      )
    : prisma.tag
        .findMany({
          where: {
            isFeatured: true,
            NOT: { id: tag.id },
            users: { some: { role: "BROKER", status: "ACTIVE" } },
          },
          select: {
            slug: true,
            label: true,
            _count: {
              select: {
                users: { where: { role: "BROKER", status: "ACTIVE" } },
              },
            },
          },
          take: 6,
        })
        .then((rows) =>
          rows.map((t) => ({
            slug: t.slug,
            label: t.label,
            shared: t._count.users,
          }))
        );

  const [
    totalSoldVehicles,
    recentDeals,
    siblings,
    activeVehiclesPerBroker,
    related,
  ] = await Promise.all([
    brokerIds.length > 0
      ? prisma.vehicle.count({
          where: { status: "SOLD", brokerId: { in: brokerIds } },
        })
      : Promise.resolve(0),
    brokerIds.length > 0
      ? prisma.vehicle.findMany({
          where: {
            status: "SOLD",
            brokerId: { in: brokerIds },
            soldAt: { not: null },
            soldPrice: { not: null },
          },
          select: {
            id: true,
            brand: true,
            model: true,
            soldPrice: true,
            soldAt: true,
            city: true,
            brokerId: true,
          },
          orderBy: { soldAt: "desc" },
          take: 3,
        })
      : Promise.resolve([]),
    tag.category
      ? prisma.tag.findMany({
          where: {
            category: tag.category,
            NOT: { id: tag.id },
            users: { some: { role: "BROKER", status: "ACTIVE" } },
          },
          select: {
            slug: true,
            label: true,
            _count: {
              select: {
                users: { where: { role: "BROKER", status: "ACTIVE" } },
              },
            },
          },
          orderBy: [{ isFeatured: "desc" }, { users: { _count: "desc" } }],
          take: 12,
        })
      : Promise.resolve([]),
    brokerIds.length > 0
      ? prisma.vehicle.groupBy({
          by: ["brokerId"],
          where: { status: "ACTIVE", brokerId: { in: brokerIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    relatedQuery,
  ]);

  const topLevelCount = tag.users.filter(
    (u) => u.level === "TOP" || u.level === "SENIOR"
  ).length;

  const activeByBroker = new Map<string, number>();
  let activeVehicles = 0;
  for (const row of activeVehiclesPerBroker) {
    if (row.brokerId) {
      activeByBroker.set(row.brokerId, row._count._all);
      activeVehicles += row._count._all;
    }
  }

  const brokerById = new Map(tag.users.map((u) => [u.id, u]));

  return {
    tag: {
      id: tag.id,
      slug: tag.slug,
      label: tag.label,
      category: tag.category,
    },
    brokers: tag.users.map((u) => {
      return {
        slug: u.slug!,
        firstName: u.firstName,
        lastName: u.lastName,
        avatar: u.avatar,
        level: u.level,
        city: u.city,
        cities: parseCities(u.cities),
        bio: u.bio,
        totalSales: u.totalSales,
        activeVehicles: activeByBroker.get(u.id) ?? 0,
        phone: u.phone,
        showPhone: u.showPhone,
        tags: u.tags,
        createdAt: u.createdAt.toISOString(),
      } satisfies BrokerGridExtra;
    }),
    stats: {
      count: tag.users.length,
      totalSoldVehicles,
      topLevelCount,
      activeVehicles,
    } satisfies LandingStats,
    recentDeals: recentDeals.map((d) => {
      const broker = d.brokerId ? brokerById.get(d.brokerId) : null;
      return {
        id: d.id,
        brand: d.brand,
        model: d.model,
        soldPrice: d.soldPrice,
        soldAt: d.soldAt,
        city: d.city,
        broker: broker
          ? {
              slug: broker.slug!,
              firstName: broker.firstName,
              lastName: broker.lastName,
            }
          : null,
      };
    }),
    siblings: siblings.map((s) => ({
      slug: s.slug,
      label: s.label,
      count: s._count.users,
    })),
    related,
  };
}

export default async function HashtagLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchLandingData(slug);

  if (!data || data.brokers.length === 0) {
    notFound();
  }

  const tagCopy: TagCopyInput = {
    slug: data.tag.slug,
    label: data.tag.label,
    category: data.tag.category,
  };

  const hero = getHeroCopy(tagCopy, data.stats);
  const faq = getFAQ(tagCopy, {
    count: data.stats.count,
    totalSoldVehicles: data.stats.totalSoldVehicles,
  });
  const siblingLabel = getSiblingSectionLabel(data.tag.category);

  const featuredBrokers = data.brokers.slice(0, 4).map((b) => ({
    slug: b.slug,
    firstName: b.firstName,
    lastName: b.lastName,
    avatar: b.avatar,
  }));

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Makléři — ${data.tag.label}`,
    numberOfItems: data.brokers.length,
    itemListElement: data.brokers.map((b, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Person",
        name: `${b.firstName} ${b.lastName}`,
        url: `${BASE_URL}/profil/${b.slug}`,
        jobTitle: b.level === "TOP" ? "TOP Automakléř" : b.level === "SENIOR" ? "Senior automakléř" : "Automakléř",
        ...(b.city && {
          address: {
            "@type": "PostalAddress",
            addressLocality: b.city,
            addressCountry: "CZ",
          },
        }),
        ...(b.avatar && { image: b.avatar }),
      },
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <main>
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Makléři", href: "/makleri" },
          { label: `#${data.tag.label}` },
        ]}
      />

      <LandingHero
        eyebrow={hero.eyebrow}
        h1={hero.h1}
        subheadline={hero.subheadline}
        stats={data.stats}
        featuredBrokers={featuredBrokers}
      />

      <section id="broker-grid" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <BrokerGrid brokers={data.brokers} />
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      </section>

      <RelatedHashtags tags={data.related} />

      {(data.recentDeals.length > 0 || data.stats.totalSoldVehicles > 0) && (
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Nedávné úspěchy makléřů {data.tag.category === "CITY" ? "v" : "s hashtagem"} #{data.tag.label}
            </h2>

            {data.recentDeals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {data.recentDeals.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                  >
                    <div className="text-lg font-bold text-gray-900">
                      🚗 {d.brand} {d.model}
                    </div>
                    {d.soldPrice !== null && (
                      <div className="text-orange-600 font-bold text-xl mt-1">
                        {formatPrice(d.soldPrice)}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                      {d.city}
                      {d.soldAt && ` · ${formatRelativeCz(d.soldAt)}`}
                    </div>
                    {d.broker?.slug && (
                      <div className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                        —{" "}
                        <Link
                          href={`/profil/${d.broker.slug}`}
                          className="hover:text-orange-600 text-gray-700 no-underline"
                        >
                          {d.broker.firstName} {d.broker.lastName}
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 border border-gray-200 text-gray-700">
                Makléři s hashtagem #{data.tag.label} za celou dobu činnosti
                zprostředkovali celkem{" "}
                <span className="font-bold text-gray-900">
                  {data.stats.totalSoldVehicles}
                </span>{" "}
                prodejů.
              </div>
            )}
          </div>
        </section>
      )}

      <CTABlockAuthAware tag={tagCopy} />

      <section className="py-12 md:py-16 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Časté otázky
          </h2>
          <FAQ items={faq} />
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </section>

      {data.siblings.length > 0 && (
        <section className="py-10 border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {siblingLabel}
              </h2>
              <Link
                href="/makleri"
                className="text-sm text-orange-600 hover:text-orange-700 no-underline font-semibold"
              >
                Všichni makléři →
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.siblings.map((s) => (
                <Link
                  key={s.slug}
                  href={`/makleri/${s.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-orange-300 text-sm text-gray-700 no-underline transition-colors"
                >
                  <span className="font-semibold">#{s.label}</span>
                  <span className="text-xs text-gray-400">
                    {s.count} makléřů
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTABlock
        variant="bottom"
        copy={{
          heading: "Nenašli jste to co hledáte?",
          body: "Prohlédněte si všechny naše ověřené makléře.",
          primary: { text: "Všichni makléři", href: "/makleri" },
        }}
      />
    </main>
  );
}

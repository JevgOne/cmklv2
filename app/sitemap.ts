import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { BRANDS, TOP_MODELS, BODY_TYPES, PRICE_RANGES, CITIES, PARTS_CATEGORIES, PARTS_BRANDS, PARTS_MODELS_BY_BRAND } from "@/lib/seo-data";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Statické stránky
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/nabidka`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/chci-prodat`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/makleri`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/inzerce`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/sluzby/proverka`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/sluzby/financovani`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/sluzby/pojisteni`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/recenze`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/o-nas`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/kariera`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/kontakt`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Informační SEO stránky
    {
      url: `${BASE_URL}/jak-prodat-auto`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/kolik-stoji-moje-auto`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Pravni stranky
    {
      url: `${BASE_URL}/obchodni-podminky`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/ochrana-osobnich-udaju`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/reklamacni-rad`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/zasady-cookies`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // SEO landing pages — značky (16)
  const brandPages: MetadataRoute.Sitemap = BRANDS.map((brand) => ({
    url: `${BASE_URL}/nabidka/${brand.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // SEO landing pages — modely (12)
  const modelPages: MetadataRoute.Sitemap = TOP_MODELS.map((model) => ({
    url: `${BASE_URL}/nabidka/${model.brandSlug}/${model.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // SEO landing pages — kategorie karoserií (7)
  const bodyTypePages: MetadataRoute.Sitemap = BODY_TYPES.map((bt) => ({
    url: `${BASE_URL}/nabidka/${bt.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // SEO landing pages — cenové rozsahy (5)
  const pricePages: MetadataRoute.Sitemap = PRICE_RANGES.map((pr) => ({
    url: `${BASE_URL}/nabidka/${pr.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // SEO landing pages — města (8)
  const cityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE_URL}/nabidka/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // SEO landing pages — díly kategorie (11)
  const partsCategoryPages: MetadataRoute.Sitemap = PARTS_CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/dily/kategorie/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // SEO landing pages — díly značky (8)
  const partsBrandPages: MetadataRoute.Sitemap = PARTS_BRANDS.map((brand) => ({
    url: `${BASE_URL}/dily/znacka/${brand.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // SEO landing pages — díly značka+model (#87b 3-segment routing, ~24)
  const partsModelPages: MetadataRoute.Sitemap = PARTS_BRANDS.flatMap((brand) =>
    (PARTS_MODELS_BY_BRAND[brand.slug] || []).map((model) => ({
      url: `${BASE_URL}/dily/znacka/${brand.slug}/${model.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  );

  // SEO landing pages — díly značka+model+rok (#87b 3-segment routing, ~72)
  const partsModelYearPages: MetadataRoute.Sitemap = PARTS_BRANDS.flatMap(
    (brand) =>
      (PARTS_MODELS_BY_BRAND[brand.slug] || []).flatMap((model) =>
        (model.topYears ?? [2015, 2018, 2020]).map((year) => ({
          url: `${BASE_URL}/dily/znacka/${brand.slug}/${model.slug}/${year}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }))
      )
  );

  // Dynamické stránky — vozidla
  let vehiclePages: MetadataRoute.Sitemap = [];
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    });

    vehiclePages = vehicles
      .filter((v) => v.slug)
      .map((v) => ({
        url: `${BASE_URL}/nabidka/${v.slug}`,
        lastModified: v.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
  } catch {
    // DB nedostupná — statické stránky stačí
  }

  // Dynamické stránky — makléři
  let brokerPages: MetadataRoute.Sitemap = [];
  try {
    const brokers = await prisma.user.findMany({
      where: { role: "BROKER", status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    });

    brokerPages = brokers
      .filter((b) => b.slug)
      .map((b) => ({
        url: `${BASE_URL}/profil/${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
  } catch {
    // DB nedostupná
  }

  // Dynamické stránky — hashtag landing pages (>= 2 aktivní brokeři)
  let tagPages: MetadataRoute.Sitemap = [];
  try {
    const tags = await prisma.tag.findMany({
      where: { users: { some: { role: "BROKER", status: "ACTIVE" } } },
      select: {
        slug: true,
        updatedAt: true,
        _count: {
          select: {
            users: { where: { role: "BROKER", status: "ACTIVE" } },
          },
        },
      },
    });

    tagPages = tags
      .filter((t) => t._count.users >= 2)
      .map((t) => ({
        url: `${BASE_URL}/makleri/${t.slug}`,
        lastModified: t.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
  } catch {
    // DB nedostupná
  }

  // Dynamické stránky — vrakoviště (partner landing pages, #87a SEO MVP)
  let partnerPages: MetadataRoute.Sitemap = [];
  try {
    const partners = await prisma.partner.findMany({
      where: { status: "AKTIVNI_PARTNER", type: "VRAKOVISTE" },
      select: { slug: true, updatedAt: true },
    });

    partnerPages = partners.map((p) => ({
      url: `${BASE_URL}/dily/vrakoviste/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // DB nedostupná
  }

  // Dynamické stránky — blog články
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });

    blogPages = articles.map((a) => ({
      url: `${BASE_URL}/blog/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB nedostupná
  }

  return [
    ...staticPages,
    ...brandPages,
    ...modelPages,
    ...bodyTypePages,
    ...pricePages,
    ...cityPages,
    ...partsCategoryPages,
    ...partsBrandPages,
    ...partsModelPages,
    ...partsModelYearPages,
    ...vehiclePages,
    ...brokerPages,
    ...tagPages,
    ...partnerPages,
    ...blogPages,
  ];
}

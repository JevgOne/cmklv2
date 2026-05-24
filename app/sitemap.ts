import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import {
  BRANDS,
  TOP_MODELS,
  BODY_TYPES,
  PRICE_RANGES,
  CITIES,
  PARTS_CATEGORIES,
  PARTS_BRANDS,
  PARTS_MODELS_BY_BRAND,
} from "@/lib/seo-data";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";

// Fixed date for static/landing pages — update when content changes (STOP-5)
const STATIC_LAST_MODIFIED = new Date("2026-05-01");

const SITEMAP_IDS = [
  "static",
  "vehicles",
  "listings",
  "parts",
  "brokers",
  "blog",
  "services",
  "partners",
  "landing-pages",
] as const;

type SitemapId = (typeof SITEMAP_IDS)[number];

export async function generateSitemaps() {
  return SITEMAP_IDS.map((_, i) => ({ id: i }));
}

export default async function sitemap(
  props: { id: Promise<number> },
): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  const sitemapType: SitemapId | undefined = SITEMAP_IDS[Number(id)];

  switch (sitemapType) {
    case "static":
      return getStaticPages();
    case "vehicles":
      return getVehiclePages();
    case "listings":
      return getListingPages();
    case "parts":
      return getPartPages();
    case "brokers":
      return getBrokerPages();
    case "blog":
      return getBlogPages();
    case "services":
      return getServicePages();
    case "partners":
      return getPartnerPages();
    case "landing-pages":
      return getLandingPages();
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Static pages
// ---------------------------------------------------------------------------
function getStaticPages(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/nabidka`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/chci-prodat`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/makleri`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/inzerce`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/shop`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/sluzby/proverka`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/sluzby/financovani`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/sluzby/pojisteni`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/recenze`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/o-nas`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/kariera`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/blog`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/kontakt`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/cenik`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/sluzby`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/pro-maklere`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/autoservisy`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/stk`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.7 },
    // Informacni SEO stranky
    { url: `${BASE_URL}/jak-prodat-auto`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/kolik-stoji-moje-auto`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.8 },
    // Pravni stranky
    { url: `${BASE_URL}/obchodni-podminky`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/ochrana-osobnich-udaju`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/reklamacni-rad`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/zasady-cookies`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
    // Dalsi verejne stranky
    { url: `${BASE_URL}/jak-to-funguje`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/marketplace`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/marketplace/apply`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/inzerce/katalog`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/shop/katalog`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/dily/katalog`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/shop/vraceni-zbozi`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/shop/reklamace`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/nabidka/porovnani`, lastModified: STATIC_LAST_MODIFIED, changeFrequency: "weekly", priority: 0.5 },
  ];
}

// ---------------------------------------------------------------------------
// Dynamic: Vehicles
// ---------------------------------------------------------------------------
async function getVehiclePages(): Promise<MetadataRoute.Sitemap> {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    });
    return vehicles
      .filter((v) => v.slug)
      .map((v) => ({
        url: `${BASE_URL}/nabidka/${v.slug}`,
        lastModified: v.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Dynamic: Listings (inzerce)
// ---------------------------------------------------------------------------
async function getListingPages(): Promise<MetadataRoute.Sitemap> {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    });
    return listings.map((l) => ({
      url: `${BASE_URL}/inzerce/katalog/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Dynamic: Parts (dily + shop)
// ---------------------------------------------------------------------------
async function getPartPages(): Promise<MetadataRoute.Sitemap> {
  try {
    const parts = await prisma.part.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    });
    return parts
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${BASE_URL}/dily/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Dynamic: Brokers + tag pages
// ---------------------------------------------------------------------------
async function getBrokerPages(): Promise<MetadataRoute.Sitemap> {
  try {
    const [brokers, tags] = await Promise.all([
      prisma.user.findMany({
        where: { role: "BROKER", status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.tag.findMany({
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
      }),
    ]);

    const brokerEntries: MetadataRoute.Sitemap = brokers
      .filter((b) => b.slug)
      .map((b) => ({
        url: `${BASE_URL}/profil/${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));

    const tagEntries: MetadataRoute.Sitemap = tags
      .filter((t) => t._count.users >= 2)
      .map((t) => ({
        url: `${BASE_URL}/makleri/${t.slug}`,
        lastModified: t.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));

    return [...brokerEntries, ...tagEntries];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Dynamic: Blog articles
// ---------------------------------------------------------------------------
async function getBlogPages(): Promise<MetadataRoute.Sitemap> {
  try {
    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });
    return articles.map((a) => ({
      url: `${BASE_URL}/blog/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Dynamic: Services (autoservisy + STK)
// ---------------------------------------------------------------------------
async function getServicePages(): Promise<MetadataRoute.Sitemap> {
  try {
    const servisy = await prisma.autoServis.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true, categories: true },
    });
    return servisy.map((s) => ({
      url: s.categories.includes("stk-emise")
        ? `${BASE_URL}/stk/${s.slug}`
        : `${BASE_URL}/autoservisy/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Dynamic: Partners (vrakoviste + autobazary)
// ---------------------------------------------------------------------------
async function getPartnerPages(): Promise<MetadataRoute.Sitemap> {
  try {
    const [vrakoviste, bazary] = await Promise.all([
      prisma.partner.findMany({
        where: { status: "AKTIVNI_PARTNER", type: "VRAKOVISTE" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.partner.findMany({
        where: { status: "AKTIVNI_PARTNER", type: "AUTOBAZAR" },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const vrakovisteEntries: MetadataRoute.Sitemap = vrakoviste.map((p) => ({
      url: `${BASE_URL}/dily/vrakoviste/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const bazarEntries: MetadataRoute.Sitemap = bazary.map((b) => ({
      url: `${BASE_URL}/bazar/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...vrakovisteEntries, ...bazarEntries];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Landing pages (brand/model/body-type/price/city + parts LP)
// ---------------------------------------------------------------------------
function getLandingPages(): MetadataRoute.Sitemap {
  // Znacky (16)
  const brandPages: MetadataRoute.Sitemap = BRANDS.map((brand) => ({
    url: `${BASE_URL}/nabidka/${brand.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Modely (12)
  const modelPages: MetadataRoute.Sitemap = TOP_MODELS.map((model) => ({
    url: `${BASE_URL}/nabidka/${model.brandSlug}/${model.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Kategorie karoserii (7)
  const bodyTypePages: MetadataRoute.Sitemap = BODY_TYPES.map((bt) => ({
    url: `${BASE_URL}/nabidka/${bt.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Cenove rozsahy (5)
  const pricePages: MetadataRoute.Sitemap = PRICE_RANGES.map((pr) => ({
    url: `${BASE_URL}/nabidka/${pr.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Mesta (8)
  const cityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE_URL}/nabidka/${city.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dily kategorie (11)
  const partsCategoryPages: MetadataRoute.Sitemap = PARTS_CATEGORIES.map((cat) => ({
    url: `${BASE_URL}/dily/kategorie/${cat.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Dily znacky (8)
  const partsBrandPages: MetadataRoute.Sitemap = PARTS_BRANDS.map((brand) => ({
    url: `${BASE_URL}/dily/znacka/${brand.slug}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Dily znacka+model (~24)
  const partsModelPages: MetadataRoute.Sitemap = PARTS_BRANDS.flatMap((brand) =>
    (PARTS_MODELS_BY_BRAND[brand.slug] || []).map((model) => ({
      url: `${BASE_URL}/dily/znacka/${brand.slug}/${model.slug}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  );

  // Dily znacka+model+rok (~72)
  const partsModelYearPages: MetadataRoute.Sitemap = PARTS_BRANDS.flatMap((brand) =>
    (PARTS_MODELS_BY_BRAND[brand.slug] || []).flatMap((model) =>
      (model.topYears ?? [2015, 2018, 2020]).map((year) => ({
        url: `${BASE_URL}/dily/znacka/${brand.slug}/${model.slug}/${year}`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
    )
  );

  return [
    ...brandPages,
    ...modelPages,
    ...bodyTypePages,
    ...pricePages,
    ...cityPages,
    ...partsCategoryPages,
    ...partsBrandPages,
    ...partsModelPages,
    ...partsModelYearPages,
  ];
}

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { BRANDS, TOP_MODELS, BODY_TYPES, PRICE_RANGES, CITIES, PARTS_CATEGORIES, PARTS_BRANDS } from "@/lib/seo-data";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.carmakler.cz";

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
      url: `${BASE_URL}/sluzby/vykup`,
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
        url: `${BASE_URL}/makler/${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
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
    ...vehiclePages,
    ...brokerPages,
  ];
}

import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

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
  ];

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

  return [...staticPages, ...vehiclePages, ...brokerPages];
}

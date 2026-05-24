/**
 * SEO metadata resolution: DB overrides + code defaults.
 *
 * DB is override, code is fallback — both must work (STOP-1).
 * When SeoPageMeta record exists AND field is non-null, use it.
 * Otherwise fall back to hardcoded defaults from page code.
 */
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { pageCanonical } from "@/lib/canonical";

interface PageMetaDefaults {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
}

/**
 * Resolve page metadata with optional DB override.
 *
 * Usage in generateMetadata():
 * ```ts
 * export async function generateMetadata(): Promise<Metadata> {
 *   return getPageMeta("/nabidka", {
 *     title: "Nabídka vozidel",
 *     description: "Prohlédněte si nabídku...",
 *   });
 * }
 * ```
 */
export async function getPageMeta(
  pagePath: string,
  defaults: PageMetaDefaults,
): Promise<Metadata> {
  let override: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    noIndex: boolean;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImageUrl: string | null;
  } | null = null;

  try {
    override = await prisma.seoPageMeta.findUnique({
      where: { pagePath },
      select: {
        title: true,
        description: true,
        canonical: true,
        noIndex: true,
        ogTitle: true,
        ogDescription: true,
        ogImageUrl: true,
      },
    });
  } catch {
    // DB unavailable — use code defaults
  }

  const title = override?.title ?? defaults.title;
  const description = override?.description ?? defaults.description;
  const ogTitle = override?.ogTitle ?? defaults.ogTitle ?? title;
  const ogDescription = override?.ogDescription ?? defaults.ogDescription ?? description;

  return {
    title,
    description,
    alternates: pageCanonical(override?.canonical ?? pagePath),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      ...(override?.ogImageUrl && {
        images: [{ url: override.ogImageUrl }],
      }),
    },
    ...(override?.noIndex && { robots: { index: false, follow: true } }),
  };
}

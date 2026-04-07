/**
 * SeoContent CRUD wrapper.
 *
 * Důvod existence: Prisma 7 compound unique input pro nullable fields
 * (`model String?`, `year Int?`, `category String?`) nedovoluje předat
 * `null` v `findUnique({ where: { pageType_brand_model_year_category: ... } })`.
 * Workaround = `findFirst` s explicit `where` (Prisma přeloží `null` na `IS NULL`).
 *
 * Wrap v cache() pro deduplikaci v rámci jednoho render cyklu (build SSG
 * pro 532 routes → každý unique BRAND row se načte jen jednou).
 */

import { cache } from "react";
import { prisma } from "@/lib/prisma";

export interface SeoContentKey {
  pageType: "BRAND" | "MODEL" | "MODEL_YEAR" | "CATEGORY";
  brand: string | null;
  model: string | null;
  year: number | null;
  category: string | null;
}

export const findSeoContent = cache(async (key: SeoContentKey) => {
  try {
    return await prisma.seoContent.findFirst({
      where: {
        pageType: key.pageType,
        brand: key.brand,
        model: key.model,
        year: key.year,
        category: key.category,
      },
    });
  } catch {
    return null;
  }
});

/**
 * Manual upsert: nelze použít prisma.seoContent.upsert() pro nullable
 * compound key (Prisma type system reject), takže dělám find → update | create.
 *
 * NEPOUŽÍVAT v page.tsx (write op). Jen pro gen scripts.
 */
export async function upsertSeoContentByKey(
  key: SeoContentKey,
  data: Omit<
    Parameters<typeof prisma.seoContent.create>[0]["data"],
    "id" | "generatedAt" | "updatedAt"
  >
) {
  const existing = await prisma.seoContent.findFirst({
    where: {
      pageType: key.pageType,
      brand: key.brand,
      model: key.model,
      year: key.year,
      category: key.category,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.seoContent.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.seoContent.create({ data });
}

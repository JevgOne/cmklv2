/**
 * Parts pricing aggregations pro /dily/znacka/* SEO landing pages.
 *
 * Poskytuje min/max/avg/count + supplier count agregace per BRAND, MODEL,
 * MODEL_YEAR. Wrapped v React `cache()` pro deduplikaci napříč stránkou
 * (model query se zavolá jen jednou i když se dotaz opakuje pro topYears).
 *
 * Wrapped v try/catch — DB nedostupná (build s dummy DATABASE_URL) → vrací
 * EMPTY stats; UI panel se v tom případě skryje (`partCount === 0`).
 *
 * P3 KNOWN LIMITATION (#87d follow-up):
 * `compatibleBrands` je `String?` JSON array, query je substring `contains`
 * (např. `{ contains: "Škoda" }`). Substring match vyrobí false positives —
 * hledání "Škoda" matchne i `["Škoda Roomster"]`. Pro pricing aggregations
 * je dopad malý (sub-brand pricing je stále reasonable), ale exact-match
 * vyžaduje migraci na PostgreSQL JSONB array path query — TODO #87d.
 */

import { cache } from "react";
import { prisma } from "@/lib/prisma";

export interface PartsStats {
  partCount: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  supplierCount: number;
}

const EMPTY_STATS: PartsStats = {
  partCount: 0,
  minPrice: 0,
  maxPrice: 0,
  avgPrice: 0,
  supplierCount: 0,
};

export const getPartsStatsForBrand = cache(
  async (brandName: string): Promise<PartsStats> => {
    try {
      const where = {
        status: "ACTIVE",
        compatibleBrands: { contains: brandName },
      };

      const [stats, suppliers] = await Promise.all([
        prisma.part.aggregate({
          where,
          _count: true,
          _min: { price: true },
          _max: { price: true },
          _avg: { price: true },
        }),
        prisma.part.groupBy({
          by: ["supplierId"],
          where,
          _count: true,
        }),
      ]);

      return {
        partCount: stats._count,
        minPrice: stats._min.price ?? 0,
        maxPrice: stats._max.price ?? 0,
        avgPrice: Math.round(stats._avg.price ?? 0),
        supplierCount: suppliers.length,
      };
    } catch {
      return EMPTY_STATS;
    }
  }
);

export const getPartsStatsForModel = cache(
  async (brandName: string, modelName: string): Promise<PartsStats> => {
    try {
      const where = {
        status: "ACTIVE",
        compatibleBrands: { contains: brandName },
        compatibleModels: { contains: modelName },
      };

      const [stats, suppliers] = await Promise.all([
        prisma.part.aggregate({
          where,
          _count: true,
          _min: { price: true },
          _max: { price: true },
          _avg: { price: true },
        }),
        prisma.part.groupBy({
          by: ["supplierId"],
          where,
          _count: true,
        }),
      ]);

      return {
        partCount: stats._count,
        minPrice: stats._min.price ?? 0,
        maxPrice: stats._max.price ?? 0,
        avgPrice: Math.round(stats._avg.price ?? 0),
        supplierCount: suppliers.length,
      };
    } catch {
      return EMPTY_STATS;
    }
  }
);

export const getPartsStatsForModelYear = cache(
  async (
    brandName: string,
    modelName: string,
    year: number
  ): Promise<PartsStats> => {
    try {
      // Year compatibility: pokud part nemá yearFrom/yearTo (universal fit pro
      // všechny ročníky), bere se jako match. Jinak musí year fit do range.
      const where = {
        status: "ACTIVE",
        compatibleBrands: { contains: brandName },
        compatibleModels: { contains: modelName },
        AND: [
          {
            OR: [
              { compatibleYearFrom: null },
              { compatibleYearFrom: { lte: year } },
            ],
          },
          {
            OR: [
              { compatibleYearTo: null },
              { compatibleYearTo: { gte: year } },
            ],
          },
        ],
      };

      const [stats, suppliers] = await Promise.all([
        prisma.part.aggregate({
          where,
          _count: true,
          _min: { price: true },
          _max: { price: true },
          _avg: { price: true },
        }),
        prisma.part.groupBy({
          by: ["supplierId"],
          where,
          _count: true,
        }),
      ]);

      return {
        partCount: stats._count,
        minPrice: stats._min.price ?? 0,
        maxPrice: stats._max.price ?? 0,
        avgPrice: Math.round(stats._avg.price ?? 0),
        supplierCount: suppliers.length,
      };
    } catch {
      return EMPTY_STATS;
    }
  }
);

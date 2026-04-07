/**
 * Parts ItemList query helpers — top 15 dílů per brand / model / model+rok.
 *
 * Použité v `/dily/znacka/[brand]`, `[brand]/[model]`, `[brand]/[model]/[rok]`
 * pro JSON-LD ItemList + render seznamu dílů na landing pages.
 *
 * Kompatibilita matchuje přes `compatibleBrands` JSON string `contains` substring
 * (per plán-task-124 §9.2). Není dokonalé (může matchnout `Škoda Roomster`
 * na query `Škoda`), ale per #87b scope acceptable. Real JSONB path query přijde s #87c.
 *
 * Wrapped v try/catch — DB nedostupná (např. build s dummy DATABASE_URL) → vrací prázdný list.
 */

import { prisma } from "@/lib/prisma";

export interface PartListItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

export interface PartsItemListData {
  parts: PartListItem[];
}

const EMPTY: PartsItemListData = { parts: [] };

function mapParts(
  parts: Array<{
    id: string;
    slug: string;
    name: string;
    price: number;
    images: { url: string }[];
  }>
): PartsItemListData {
  return {
    parts: parts.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      image: p.images[0]?.url ?? null,
    })),
  };
}

export async function getTopPartsForBrand(brandName: string): Promise<PartsItemListData> {
  try {
    const parts = await prisma.part.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { compatibleBrands: { contains: brandName } },
          { universalFit: true },
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        images: {
          select: { url: true },
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { viewCount: "desc" },
      take: 15,
    });
    return mapParts(parts);
  } catch {
    return EMPTY;
  }
}

export async function getTopPartsForBrandModel(
  brandName: string,
  modelName: string
): Promise<PartsItemListData> {
  try {
    const parts = await prisma.part.findMany({
      where: {
        status: "ACTIVE",
        AND: [
          { compatibleBrands: { contains: brandName } },
          { compatibleModels: { contains: modelName } },
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        images: {
          select: { url: true },
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { viewCount: "desc" },
      take: 15,
    });
    return mapParts(parts);
  } catch {
    return EMPTY;
  }
}

export async function getTopPartsForBrandModelYear(
  brandName: string,
  modelName: string,
  year: number
): Promise<PartsItemListData> {
  try {
    const parts = await prisma.part.findMany({
      where: {
        status: "ACTIVE",
        AND: [
          { compatibleBrands: { contains: brandName } },
          { compatibleModels: { contains: modelName } },
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
      },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        images: {
          select: { url: true },
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { viewCount: "desc" },
      take: 15,
    });
    return mapParts(parts);
  } catch {
    return EMPTY;
  }
}

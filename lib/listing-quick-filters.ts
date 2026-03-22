// ============================================
// Quick Filters — předdefinované filtry pro inzertní platformu
// ============================================

export interface QuickFilterDefinition {
  label: string;
  slug: string;
  icon: string; // Emoji nebo Lucide icon name
  description: string;
  params: {
    bodyType?: string;
    fuelType?: string;
    maxPrice?: number;
    minPrice?: number;
    minYear?: number;
    maxYear?: number;
    transmission?: string;
  };
}

export const QUICK_FILTERS: QuickFilterDefinition[] = [
  {
    label: "SUV do 500k",
    slug: "suv-do-500k",
    icon: "mountain",
    description: "Prostorná SUV do půl milionu",
    params: {
      bodyType: "SUV",
      maxPrice: 500000,
    },
  },
  {
    label: "Elektro",
    slug: "elektro",
    icon: "zap",
    description: "Elektromobily všech značek",
    params: {
      fuelType: "ELECTRIC",
    },
  },
  {
    label: "Pro rodinu",
    slug: "pro-rodinu",
    icon: "users",
    description: "Combi a MPV pro celou rodinu",
    params: {
      bodyType: "COMBI",
      minYear: 2015,
    },
  },
  {
    label: "První auto do 200k",
    slug: "prvni-auto-do-200k",
    icon: "graduation-cap",
    description: "Spolehlivá auta pro začátečníky",
    params: {
      maxPrice: 200000,
      minYear: 2010,
    },
  },
  {
    label: "Hybrid",
    slug: "hybrid",
    icon: "leaf",
    description: "Hybridní vozy — úsporné a ekologické",
    params: {
      fuelType: "HYBRID",
    },
  },
  {
    label: "Diesel do 300k",
    slug: "diesel-do-300k",
    icon: "fuel",
    description: "Dieselová auta s nízkou spotřebou",
    params: {
      fuelType: "DIESEL",
      maxPrice: 300000,
    },
  },
];

/**
 * Najde quick filter definici podle slugu
 */
export function getQuickFilterBySlug(slug: string): QuickFilterDefinition | undefined {
  return QUICK_FILTERS.find((f) => f.slug === slug);
}

/**
 * Převede quick filter na Prisma where podmínky
 */
export function quickFilterToWhere(filter: QuickFilterDefinition): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (filter.params.bodyType) where.bodyType = filter.params.bodyType;
  if (filter.params.fuelType) where.fuelType = filter.params.fuelType;
  if (filter.params.transmission) where.transmission = filter.params.transmission;

  if (filter.params.minPrice || filter.params.maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (filter.params.minPrice) priceFilter.gte = filter.params.minPrice;
    if (filter.params.maxPrice) priceFilter.lte = filter.params.maxPrice;
    where.price = priceFilter;
  }

  if (filter.params.minYear || filter.params.maxYear) {
    const yearFilter: Record<string, number> = {};
    if (filter.params.minYear) yearFilter.gte = filter.params.minYear;
    if (filter.params.maxYear) yearFilter.lte = filter.params.maxYear;
    where.year = yearFilter;
  }

  return where;
}

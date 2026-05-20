/**
 * Real-time market data fetcher for vehicle price analysis.
 * Fetches from AutoScout24 (CZ/DE/AT), Sauto.cz, and Mobile.de.
 * Uses in-memory cache with 4h TTL and LRU eviction (max 500 entries).
 */

import { prisma } from "@/lib/prisma";
import {
  brandToAS24Slug,
  modelToAS24Slug,
  brandToMobileDe,
  modelToMobileDe,
} from "@/lib/brand-model-slugs";

// --- Types ---

export interface PricePoint {
  price: number; // CZK
  year: number | null;
  mileage: number | null;
  source: "AUTOSCOUT24" | "SAUTO" | "MOBILE_DE";
  url: string | null;
  title: string | null;
}

export interface HistogramBucket {
  min: number;
  max: number;
  count: number;
  isCurrent: boolean;
}

export interface PriceStats {
  median: number;
  mean: number;
  min: number;
  max: number;
  count: number;
  percentile: number;
}

export interface PriceVerdict {
  verdict: "LOW" | "OK" | "HIGH";
  deviationPercent: number;
  label: string;
}

export interface MarketAnalysisResult {
  prices: PricePoint[];
  histogram: HistogramBucket[];
  stats: PriceStats;
  verdict: PriceVerdict;
  similarOffers: PricePoint[];
  sources: { autoscout24: number; sauto: number; mobile_de: number };
  fromCache: boolean;
  fetchedAt: string;
  dbFallback: boolean;
}

// --- Constants ---

const EUR_TO_CZK = 25.5;
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
const CACHE_MAX_SIZE = 500;
const FETCH_TIMEOUT = 8000; // 8s per source
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// --- Cache ---

interface CacheEntry {
  data: MarketAnalysisResult;
  timestamp: number;
  key: string;
}

const marketCache = new Map<string, CacheEntry>();

function cacheGet(key: string): MarketAnalysisResult | null {
  const entry = marketCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    marketCache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key: string, data: MarketAnalysisResult): void {
  // LRU eviction: remove oldest entry if at capacity
  if (marketCache.size >= CACHE_MAX_SIZE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of marketCache) {
      if (v.timestamp < oldestTime) {
        oldestTime = v.timestamp;
        oldestKey = k;
      }
    }
    if (oldestKey) marketCache.delete(oldestKey);
  }
  marketCache.set(key, { data, timestamp: Date.now(), key });
}

// --- Fetch helpers ---

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "cs,en;q=0.9",
        ...options.headers,
      },
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

// --- AutoScout24 fetcher ---

async function fetchAS24(
  brand: string,
  model: string,
  year: number,
  country: "cz" | "de" | "at"
): Promise<PricePoint[]> {
  const brandSlug = brandToAS24Slug(brand);
  const modelSlug = modelToAS24Slug(brand, model);
  const domain =
    country === "cz"
      ? "www.autoscout24.cz"
      : country === "de"
        ? "www.autoscout24.de"
        : "www.autoscout24.at";

  const url = `https://${domain}/lst/${brandSlug}/${modelSlug}?fregfrom=${year - 2}&fregto=${year + 2}&custtype=P&sort=price&ustate=N%2CU&atype=C&size=50&page=1`;

  const response = await fetchWithTimeout(url);
  if (!response.ok) return [];

  const html = await response.text();
  const prices: PricePoint[] = [];

  // Parse data-price attributes from article elements
  const priceRegex = /data-price="(\d+)"/g;
  let match;
  while ((match = priceRegex.exec(html)) !== null) {
    const rawPrice = parseInt(match[1], 10);
    if (rawPrice <= 0) continue;

    const priceCZK =
      country === "cz" ? rawPrice : Math.round(rawPrice * EUR_TO_CZK);

    prices.push({
      price: priceCZK,
      year: null,
      mileage: null,
      source: "AUTOSCOUT24",
      url: `https://${domain}/lst/${brandSlug}/${modelSlug}`,
      title: null,
    });
  }

  // Fallback: try JSON-LD or other price patterns if no data-price found
  if (prices.length === 0) {
    const altPriceRegex = /"price"\s*:\s*"?(\d+)"?/g;
    while ((match = altPriceRegex.exec(html)) !== null) {
      const rawPrice = parseInt(match[1], 10);
      if (rawPrice <= 0 || rawPrice > 50_000_000) continue;

      const priceCZK =
        country === "cz" ? rawPrice : Math.round(rawPrice * EUR_TO_CZK);

      prices.push({
        price: priceCZK,
        year: null,
        mileage: null,
        source: "AUTOSCOUT24",
        url: `https://${domain}/lst/${brandSlug}/${modelSlug}`,
        title: null,
      });
    }
  }

  return prices;
}

// --- Sauto.cz fetcher ---

async function fetchSauto(
  brand: string,
  model: string,
  year: number
): Promise<PricePoint[]> {
  const brandSlug = brandToAS24Slug(brand); // same lowercase normalization
  const url = `https://www.sauto.cz/api/v1/items/search?manufacturer_model_seo=${brandSlug}&category_id=838&condition_seo=ojete&limit=100&offset=0`;

  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!response.ok) return [];

  const data = await response.json();
  const items: Array<{
    price?: number;
    year?: number;
    mileage?: number;
    name?: string;
    seo_url?: string;
  }> = data?.items || data?.results || [];

  const prices: PricePoint[] = [];
  const modelLower = model.toLowerCase();

  for (const item of items) {
    // Filter by model name (API only filters by brand)
    const itemName = (item.name || "").toLowerCase();
    if (modelLower && !itemName.includes(modelLower)) continue;

    // Filter by year range (±2)
    if (item.year && (item.year < year - 2 || item.year > year + 2)) continue;

    const price = item.price;
    if (!price || price <= 0) continue;

    prices.push({
      price,
      year: item.year || null,
      mileage: item.mileage || null,
      source: "SAUTO",
      url: item.seo_url
        ? `https://www.sauto.cz${item.seo_url}`
        : null,
      title: item.name || null,
    });
  }

  return prices;
}

// --- Mobile.de fetcher ---

async function fetchMobileDe(
  brand: string,
  model: string,
  year: number
): Promise<PricePoint[]> {
  const brandUpper = brandToMobileDe(brand);
  const modelUpper = modelToMobileDe(model);

  const url = `https://services.mobile.de/search-api/search?classification=refdata/classes/Car/makes/${brandUpper}/models/${modelUpper}&firstRegistrationDate.min=${year - 2}-01&firstRegistrationDate.max=${year + 2}-12&sellerType=FOR_SALE_BY_OWNER&price.min=1000&page.size=50`;

  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  if (!response.ok) return [];

  const data = await response.json();
  const results: Array<{
    price?: { amount?: number };
    firstRegistrationDate?: string;
    mileage?: { value?: number };
    title?: string;
    url?: string;
    id?: string;
  }> = data?.content || data?.results || data?.searchResult?.items || [];

  const prices: PricePoint[] = [];

  for (const item of results) {
    const priceEur = item.price?.amount;
    if (!priceEur || priceEur <= 0) continue;

    const priceCZK = Math.round(priceEur * EUR_TO_CZK);
    const regYear = item.firstRegistrationDate
      ? parseInt(item.firstRegistrationDate.substring(0, 4), 10)
      : null;

    prices.push({
      price: priceCZK,
      year: regYear,
      mileage: item.mileage?.value || null,
      source: "MOBILE_DE",
      url: item.url || (item.id ? `https://www.mobile.de/auto/${item.id}` : null),
      title: item.title || null,
    });
  }

  return prices;
}

// --- Analysis computation ---

export function computeAnalysis(
  prices: PricePoint[],
  leadPrice: number
): Omit<MarketAnalysisResult, "fromCache" | "fetchedAt" | "dbFallback"> {
  const validPrices = prices
    .map((p) => p.price)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  if (validPrices.length < 5) {
    return {
      prices,
      histogram: [],
      stats: { median: 0, mean: 0, min: 0, max: 0, count: 0, percentile: 0 },
      verdict: { verdict: "OK", deviationPercent: 0, label: "Nedostatek dat" },
      similarOffers: [],
      sources: {
        autoscout24: prices.filter((p) => p.source === "AUTOSCOUT24").length,
        sauto: prices.filter((p) => p.source === "SAUTO").length,
        mobile_de: prices.filter((p) => p.source === "MOBILE_DE").length,
      },
    };
  }

  // Histogram: 10 buckets
  const min = validPrices[0];
  const max = validPrices[validPrices.length - 1];
  const bucketSize = Math.ceil((max - min) / 10) || 1;

  const buckets: HistogramBucket[] = Array.from({ length: 10 }, (_, i) => ({
    min: min + i * bucketSize,
    max: min + (i + 1) * bucketSize,
    count: 0,
    isCurrent: false,
  }));

  for (const price of validPrices) {
    const idx = Math.min(Math.floor((price - min) / bucketSize), 9);
    buckets[idx].count++;
  }

  // Mark current lead's bucket
  if (leadPrice >= min && leadPrice <= max) {
    const idx = Math.min(Math.floor((leadPrice - min) / bucketSize), 9);
    buckets[idx].isCurrent = true;
  }

  // Stats
  const median = validPrices[Math.floor(validPrices.length / 2)];
  const mean = Math.round(
    validPrices.reduce((a, b) => a + b, 0) / validPrices.length
  );
  const deviation = ((leadPrice - median) / median) * 100;

  // Percentile
  const belowCount = validPrices.filter((p) => p < leadPrice).length;
  const percentile = Math.round((belowCount / validPrices.length) * 100);

  // Verdict
  let verdict: "LOW" | "OK" | "HIGH";
  let label: string;
  if (deviation < -15) {
    verdict = "LOW";
    label = `Pod trhem (${Math.round(deviation)}%)`;
  } else if (deviation > 15) {
    verdict = "HIGH";
    label = `Nad trhem (+${Math.round(deviation)}%)`;
  } else {
    verdict = "OK";
    label = "V normalu";
  }

  // Top 5 similar offers (closest by price)
  const similarOffers = prices
    .filter((p) => p.price > 0)
    .sort(
      (a, b) =>
        Math.abs(a.price - leadPrice) - Math.abs(b.price - leadPrice)
    )
    .slice(0, 5);

  return {
    prices,
    histogram: buckets,
    stats: { median, mean, min, max, count: validPrices.length, percentile },
    verdict: { verdict, deviationPercent: Math.round(deviation), label },
    similarOffers,
    sources: {
      autoscout24: prices.filter((p) => p.source === "AUTOSCOUT24").length,
      sauto: prices.filter((p) => p.source === "SAUTO").length,
      mobile_de: prices.filter((p) => p.source === "MOBILE_DE").length,
    },
  };
}

// --- DB fallback ---

async function fetchDBFallback(
  leadId: string,
  brand: string,
  model: string,
  year: number
): Promise<PricePoint[]> {
  const dbSimilar = await prisma.scoutLead.findMany({
    where: {
      vehicleBrand: brand,
      vehicleModel: model,
      vehicleYear: { gte: year - 2, lte: year + 2 },
      vehiclePrice: { not: null, gt: 0 },
      id: { not: leadId },
    },
    select: {
      vehiclePrice: true,
      vehicleYear: true,
      vehicleMileage: true,
      sourceUrl: true,
      listingTitle: true,
      source: true,
    },
    take: 200,
  });

  return dbSimilar.map((s) => ({
    price: s.vehiclePrice!,
    year: s.vehicleYear,
    mileage: s.vehicleMileage,
    source: (s.source as PricePoint["source"]) || "AUTOSCOUT24",
    url: s.sourceUrl,
    title: s.listingTitle,
  }));
}

// --- Main entry point ---

export async function fetchMarketData(
  leadId: string,
  brand: string,
  model: string,
  year: number,
  leadPrice: number
): Promise<MarketAnalysisResult> {
  const cacheKey = `market:${brand.toLowerCase()}:${model.toLowerCase()}:${year}`;

  // Check cache
  const cached = cacheGet(cacheKey);
  if (cached) {
    // Recompute verdict with current lead price
    const recomputed = computeAnalysis(cached.prices, leadPrice);
    return {
      ...recomputed,
      fromCache: true,
      fetchedAt: cached.fetchedAt,
      dbFallback: cached.dbFallback,
    };
  }

  // Fetch from all internet sources in parallel
  const [as24CZ, as24DE, as24AT, sauto, mobile] = await Promise.allSettled([
    fetchAS24(brand, model, year, "cz"),
    fetchAS24(brand, model, year, "de"),
    fetchAS24(brand, model, year, "at"),
    fetchSauto(brand, model, year),
    fetchMobileDe(brand, model, year),
  ]);

  const allPrices = [as24CZ, as24DE, as24AT, sauto, mobile]
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<PricePoint[]>).value);

  // Fallback chain
  let dbFallback = false;

  if (allPrices.length < 5) {
    // Try DB fallback
    const dbPrices = await fetchDBFallback(leadId, brand, model, year);
    if (dbPrices.length >= 5) {
      dbFallback = true;
      allPrices.push(...dbPrices);
    }
  }

  const analysis = computeAnalysis(allPrices, leadPrice);
  const result: MarketAnalysisResult = {
    ...analysis,
    fromCache: false,
    fetchedAt: new Date().toISOString(),
    dbFallback,
  };

  // Cache the result (only if we got some data)
  if (allPrices.length > 0) {
    cacheSet(cacheKey, result);
  }

  return result;
}

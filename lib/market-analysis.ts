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
// AS24 CZ already returns EU-wide listings, so we only fetch from .cz
// and post-filter by model name to avoid wrong-model results.

async function fetchAS24(
  brand: string,
  model: string,
  year: number
): Promise<PricePoint[]> {
  const brandSlug = brandToAS24Slug(brand);
  const modelSlug = modelToAS24Slug(brand, model);
  const domain = "www.autoscout24.cz";

  const url = `https://${domain}/lst/${brandSlug}/${modelSlug}?fregfrom=${year - 2}&fregto=${year + 2}&custtype=P&sort=price&ustate=N%2CU&atype=C&size=50&page=1`;

  const response = await fetchWithTimeout(url);
  if (!response.ok) return [];

  const html = await response.text();
  const prices: PricePoint[] = [];

  // AS24 is a Next.js app — extract __NEXT_DATA__ JSON with full listing data
  const jsonMatch = html.match(/__NEXT_DATA__[^{]*({.+?})\s*<\/script>/);
  if (!jsonMatch) return prices;

  try {
    const data = JSON.parse(jsonMatch[1]);
    const listings: Array<{
      price?: { priceFormatted?: string };
      vehicle?: {
        make?: string;
        model?: string;
        modelVersionInput?: string;
        mileageInKmFormatted?: string;
        mileageInKm?: string | number;
        firstRegistrationDate?: string;
        fuel?: string;
        transmission?: string;
      };
      url?: string;
      location?: { city?: string; countryCode?: string };
    }> = data?.props?.pageProps?.listings || [];

    const modelLower = model.toLowerCase();

    for (const item of listings) {
      // Post-filter by model name — skip wrong models (e.g. Astra for Corsa search)
      const vehicleModel = (item.vehicle?.model || "").toLowerCase();
      const vehicleVersion = (item.vehicle?.modelVersionInput || "").toLowerCase();
      if (!vehicleModel.includes(modelLower) && !vehicleVersion.includes(modelLower)) {
        continue;
      }

      // Parse price from "€ 3 600" format — always EUR on AS24
      const priceStr = item.price?.priceFormatted || "";
      const priceNum = parseInt(priceStr.replace(/[^\d]/g, ""), 10);
      if (!priceNum || priceNum <= 0) continue;
      const priceCZK = Math.round(priceNum * EUR_TO_CZK);

      // Parse mileage
      const kmRaw = item.vehicle?.mileageInKmFormatted || item.vehicle?.mileageInKm || "";
      const kmStr = typeof kmRaw === "number" ? String(kmRaw) : kmRaw;
      const mileage = parseInt(kmStr.replace(/[^\d]/g, ""), 10) || null;

      // Parse year from firstRegistrationDate (e.g. "2018-06" or "06/2018")
      const regDate = item.vehicle?.firstRegistrationDate || "";
      const yearMatch = regDate.match?.(/\b(19[89]\d|20[0-3]\d)\b/);
      const listingYear = yearMatch ? parseInt(yearMatch[1], 10) : null;

      // Build title
      const v = item.vehicle;
      const title = v?.modelVersionInput
        || [v?.make, v?.model].filter(Boolean).join(" ")
        || null;

      // Build URL — use listing's actual country domain for correct links
      const countryCode = (item.location?.countryCode || "").toLowerCase();
      const listingDomain =
        countryCode === "de" ? "www.autoscout24.de"
        : countryCode === "at" ? "www.autoscout24.at"
        : countryCode === "it" ? "www.autoscout24.it"
        : countryCode === "nl" ? "www.autoscout24.nl"
        : countryCode === "be" ? "www.autoscout24.be"
        : countryCode === "fr" ? "www.autoscout24.fr"
        : "www.autoscout24.cz";
      const itemUrl = item.url ? `https://${listingDomain}${item.url}` : null;

      prices.push({
        price: priceCZK,
        year: listingYear,
        mileage,
        source: "AUTOSCOUT24",
        url: itemUrl,
        title,
      });
    }
  } catch {
    // JSON parse failed — return empty
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
    label = "V normálu";
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
  // AS24 CZ already includes EU-wide listings, no need to fetch DE/AT separately
  const [as24, sauto, mobile] = await Promise.allSettled([
    fetchAS24(brand, model, year),
    fetchSauto(brand, model, year),
    fetchMobileDe(brand, model, year),
  ]);

  const allPrices = [as24, sauto, mobile]
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

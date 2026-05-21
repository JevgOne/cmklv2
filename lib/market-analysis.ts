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
  matchLevel?: string;
}

// --- Match Options ---

export interface MarketMatchOptions {
  fuel?: string | null;
  transmission?: string | null;
  mileage?: number | null;
  yearSpread?: number; // default 1
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
  year: number,
  options: MarketMatchOptions = {}
): Promise<PricePoint[]> {
  const brandSlug = brandToAS24Slug(brand);
  const modelSlug = modelToAS24Slug(brand, model);
  const domain = "www.autoscout24.cz";

  // Year range (default ±1, wider on fallback)
  const spread = options.yearSpread ?? 1;
  const url = new URL(`https://${domain}/lst/${brandSlug}/${modelSlug}`);
  url.searchParams.set("fregfrom", String(year - spread));
  url.searchParams.set("fregto", String(year + spread));
  url.searchParams.set("custtype", "P");
  url.searchParams.set("sort", "price");
  url.searchParams.set("ustate", "N,U");
  url.searchParams.set("atype", "C");
  url.searchParams.set("size", "50");
  url.searchParams.set("page", "1");

  // Fuel — exact match
  if (options.fuel) {
    const fuelMap: Record<string, string> = {
      DIESEL: "D", PETROL: "B", HYBRID: "2", ELECTRIC: "E", LPG: "L", CNG: "C",
    };
    const f = fuelMap[options.fuel];
    if (f) url.searchParams.set("fuel", f);
  }

  // Transmission — exact match
  if (options.transmission) {
    const gearMap: Record<string, string> = { AUTOMATIC: "A", MANUAL: "M" };
    const g = gearMap[options.transmission];
    if (g) url.searchParams.set("gear", g);
  }

  // Mileage — ±40k range
  if (options.mileage) {
    url.searchParams.set("kmfrom", String(Math.max(0, options.mileage - 40000)));
    url.searchParams.set("kmto", String(options.mileage + 40000));
  }

  const response = await fetchWithTimeout(url.toString());
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
  year: number,
  options: MarketMatchOptions = {}
): Promise<PricePoint[]> {
  const brandSlug = brandToAS24Slug(brand); // same lowercase normalization

  // Build URL with SUPPORTED Sauto API filters
  const url = new URL("https://www.sauto.cz/api/v1/items/search");
  url.searchParams.set("manufacturer_model_seo", brandSlug);
  url.searchParams.set("category_id", "838");
  url.searchParams.set("condition_seo", "ojete");
  url.searchParams.set("limit", "100");
  url.searchParams.set("offset", "0");

  // Fuel — exact match (API supported)
  if (options.fuel) {
    const fuelMap: Record<string, string> = {
      DIESEL: "nafta", PETROL: "benzin", HYBRID: "hybrid",
      ELECTRIC: "elektro", LPG: "lpg", CNG: "cng",
    };
    const f = fuelMap[options.fuel];
    if (f) url.searchParams.set("fuel_seo", f);
  }

  // Transmission — exact match (API supported)
  if (options.transmission) {
    const gearMap: Record<string, string> = { AUTOMATIC: "automaticka", MANUAL: "manualni" };
    const g = gearMap[options.transmission];
    if (g) url.searchParams.set("gearbox_seo", g);
  }

  // Mileage — ±40k range (API supported)
  if (options.mileage) {
    url.searchParams.set("tachometer_from", String(Math.max(0, options.mileage - 40000)));
    url.searchParams.set("tachometer_to", String(options.mileage + 40000));
  }

  const response = await fetchWithTimeout(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!response.ok) return [];

  const data = await response.json();
  const items: Array<{
    id?: number;
    price?: number;
    tachometer?: number;
    in_operation_date?: string;
    manufacturing_date?: string;
    name?: string;
    model_cb?: { name?: string; seo_name?: string };
    fuel_cb?: { name?: string; seo_name?: string };
    gearbox_cb?: { name?: string; seo_name?: string };
  }> = data?.items || data?.results || [];

  const prices: PricePoint[] = [];
  const modelLower = model.toLowerCase();

  for (const item of items) {
    // Post-filter by model (API doesn't support model filter)
    const itemName = (item.name || "").toLowerCase();
    const itemModel = (item.model_cb?.name || "").toLowerCase();
    if (modelLower && !itemName.includes(modelLower) && !itemModel.includes(modelLower)) continue;

    // Parse year from in_operation_date ("2014-06-01") or manufacturing_date ("2013")
    const dateStr = item.in_operation_date || item.manufacturing_date || "";
    const yearMatch = dateStr.match(/(19[89]\d|20[0-3]\d)/);
    const itemYear = yearMatch ? parseInt(yearMatch[1], 10) : null;

    // Post-filter by year range (API doesn't support year filter)
    const spread = options.yearSpread ?? 1;
    if (itemYear && (itemYear < year - spread || itemYear > year + spread)) continue;

    const price = item.price;
    if (!price || price <= 0) continue;

    prices.push({
      price,
      year: itemYear,
      mileage: item.tachometer || null,
      source: "SAUTO",
      url: item.id ? `https://www.sauto.cz/osobni/detail/${item.id}` : null,
      title: item.name || null,
    });
  }

  return prices;
}

// --- Mobile.de fetcher ---

async function fetchMobileDe(
  brand: string,
  model: string,
  year: number,
  options: MarketMatchOptions = {}
): Promise<PricePoint[]> {
  const brandUpper = brandToMobileDe(brand);
  const modelUpper = modelToMobileDe(model);

  // Year range (default ±1, wider on fallback)
  const spread = options.yearSpread ?? 1;
  const url = new URL("https://services.mobile.de/search-api/search");
  url.searchParams.set("classification", `refdata/classes/Car/makes/${brandUpper}/models/${modelUpper}`);
  url.searchParams.set("firstRegistrationDate.min", `${year - spread}-01`);
  url.searchParams.set("firstRegistrationDate.max", `${year + spread}-12`);
  url.searchParams.set("sellerType", "FOR_SALE_BY_OWNER");
  url.searchParams.set("price.min", "1000");
  url.searchParams.set("page.size", "50");

  // Fuel
  if (options.fuel) {
    const fuelMap: Record<string, string> = {
      DIESEL: "DIESEL", PETROL: "PETROL", HYBRID: "HYBRID",
      ELECTRIC: "ELECTRIC", LPG: "LPG", CNG: "CNG",
    };
    const f = fuelMap[options.fuel];
    if (f) url.searchParams.set("fuel", f);
  }

  // Transmission
  if (options.transmission) {
    const gearMap: Record<string, string> = { AUTOMATIC: "AUTOMATIC", MANUAL: "MANUAL" };
    const g = gearMap[options.transmission];
    if (g) url.searchParams.set("transmission", g);
  }

  // Mileage ±40k
  if (options.mileage) {
    url.searchParams.set("mileage.min", String(Math.max(0, options.mileage - 40000)));
    url.searchParams.set("mileage.max", String(options.mileage + 40000));
  }

  const response = await fetchWithTimeout(url.toString(), {
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
  const rawPrices = prices
    .map((p) => p.price)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  if (rawPrices.length < 3) {
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

  // Filter outliers using IQR method — removes nonsensical prices
  const q1 = rawPrices[Math.floor(rawPrices.length * 0.25)];
  const q3 = rawPrices[Math.floor(rawPrices.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const validPrices = rawPrices.filter((p) => p >= lowerBound && p <= upperBound);

  // Fall back to raw if IQR filtering removed too much
  const finalPrices = validPrices.length >= 3 ? validPrices : rawPrices;

  // Histogram: 10 buckets
  const min = finalPrices[0];
  const max = finalPrices[finalPrices.length - 1];
  const bucketSize = Math.ceil((max - min) / 10) || 1;

  const buckets: HistogramBucket[] = Array.from({ length: 10 }, (_, i) => ({
    min: min + i * bucketSize,
    max: min + (i + 1) * bucketSize,
    count: 0,
    isCurrent: false,
  }));

  for (const price of finalPrices) {
    const idx = Math.min(Math.floor((price - min) / bucketSize), 9);
    buckets[idx].count++;
  }

  // Mark current lead's bucket
  if (leadPrice >= min && leadPrice <= max) {
    const idx = Math.min(Math.floor((leadPrice - min) / bucketSize), 9);
    buckets[idx].isCurrent = true;
  }

  // Stats
  const median = finalPrices[Math.floor(finalPrices.length / 2)];
  const mean = Math.round(
    finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length
  );
  const deviation = ((leadPrice - median) / median) * 100;

  // Percentile
  const belowCount = finalPrices.filter((p) => p < leadPrice).length;
  const percentile = Math.round((belowCount / finalPrices.length) * 100);

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

  // Top 5 similar offers — balanced selection (2 below + 3 above, or vice versa)
  const filteredPrices = prices.filter(
    (p) => p.price >= lowerBound && p.price <= upperBound
  );
  const sortedOffers = (filteredPrices.length >= 3 ? filteredPrices : prices)
    .filter((p) => p.price > 0)
    .sort((a, b) => a.price - b.price);

  const belowLead = sortedOffers.filter(p => p.price < leadPrice);
  const aboveLead = sortedOffers.filter(p => p.price >= leadPrice);

  let similarOffers: PricePoint[];
  if (belowLead.length >= 2 && aboveLead.length >= 3) {
    similarOffers = [...belowLead.slice(-2), ...aboveLead.slice(0, 3)];
  } else if (belowLead.length >= 3 && aboveLead.length >= 2) {
    similarOffers = [...belowLead.slice(-3), ...aboveLead.slice(0, 2)];
  } else {
    // Fallback: closest by price
    similarOffers = [...sortedOffers]
      .sort((a, b) => Math.abs(a.price - leadPrice) - Math.abs(b.price - leadPrice))
      .slice(0, 5);
  }

  return {
    prices: filteredPrices.length >= 3 ? filteredPrices : prices,
    histogram: buckets,
    stats: { median, mean, min, max, count: finalPrices.length, percentile },
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
  year: number,
  options: MarketMatchOptions = {}
): Promise<PricePoint[]> {
  const where: Record<string, unknown> = {
    vehicleBrand: brand,
    vehicleModel: model,
    vehicleYear: { gte: year - (options.yearSpread ?? 1), lte: year + (options.yearSpread ?? 1) },
    vehiclePrice: { not: null, gt: 0 },
    id: { not: leadId },
  };

  if (options.fuel) where.vehicleFuel = options.fuel;
  if (options.transmission) where.vehicleTransmission = options.transmission;
  if (options.mileage) {
    where.vehicleMileage = {
      gte: Math.max(0, options.mileage - 40000),
      lte: options.mileage + 40000,
    };
  }

  const dbSimilar = await prisma.scoutLead.findMany({
    where,
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
  leadPrice: number,
  options: MarketMatchOptions = {}
): Promise<MarketAnalysisResult> {
  // Cache key includes fuel+transmission for precision
  const fuelKey = options.fuel?.toLowerCase() || "any";
  const transKey = options.transmission?.toLowerCase() || "any";
  const cacheKey = `market:${brand.toLowerCase()}:${model.toLowerCase()}:${year}:${fuelKey}:${transKey}`;

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
      matchLevel: cached.matchLevel,
    };
  }

  // Fallback cascade — progressively relax filters if too few results
  // 1. strict: ±1 year, exact fuel, exact trans, ±40k km
  // 2. no-mileage: ±1 year, exact fuel, exact trans
  // 3. year±2: ±2 years, exact fuel, exact trans
  // 4. fuel-only: ±2 years, exact fuel
  // 5. broad: ±2 years, no other filters
  const fallbackLevels: { label: string; opts: MarketMatchOptions }[] = [
    { label: "strict", opts: { ...options } },
    { label: "no-mileage", opts: { ...options, mileage: null } },
    { label: "year±2", opts: { fuel: options.fuel, transmission: options.transmission, mileage: null, yearSpread: 2 } },
    { label: "fuel-only", opts: { fuel: options.fuel, mileage: null, yearSpread: 2 } },
    { label: "broad", opts: { yearSpread: 2 } },
  ];

  const allPrices: PricePoint[] = [];
  let matchLevel = "strict";
  const seenUrls = new Set<string>();

  for (const level of fallbackLevels) {
    const [as24, sauto, mobile] = await Promise.allSettled([
      fetchAS24(brand, model, year, level.opts),
      fetchSauto(brand, model, year, level.opts),
      fetchMobileDe(brand, model, year, level.opts),
    ]);

    const newPrices = [as24, sauto, mobile]
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<PricePoint[]>).value)
      .filter((p) => {
        // Deduplicate by URL
        if (!p.url) return true;
        if (seenUrls.has(p.url)) return false;
        seenUrls.add(p.url);
        return true;
      });

    allPrices.push(...newPrices);
    matchLevel = level.label;

    if (allPrices.length >= 5) break;
  }

  // Enrich with DB data if still few results
  let dbFallback = false;
  if (allPrices.length < 10) {
    const dbPrices = await fetchDBFallback(leadId, brand, model, year, options);
    if (dbPrices.length > 0) {
      dbFallback = allPrices.length === 0;
      allPrices.push(...dbPrices);
    }
  }

  const analysis = computeAnalysis(allPrices, leadPrice);
  const result: MarketAnalysisResult = {
    ...analysis,
    fromCache: false,
    fetchedAt: new Date().toISOString(),
    dbFallback,
    matchLevel,
  };

  // Cache the result (only if we got some data)
  if (allPrices.length > 0) {
    cacheSet(cacheKey, result);
  }

  return result;
}

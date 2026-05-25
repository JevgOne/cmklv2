import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  PostgreSQL fulltext search helpers                                  */
/* ------------------------------------------------------------------ */

export interface SearchResult {
  id: string;
  type: "part" | "vehicle" | "listing";
  title: string;
  subtitle: string;
  slug: string;
  price: number;
  image?: string | null;
  rank: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  suggestions: string[];
}

/**
 * Sanitize search query for PostgreSQL tsquery.
 * Splits into words, escapes special characters, joins with &.
 */
function sanitizeQuery(query: string): string {
  return query
    .trim()
    .replace(/[^\w\sáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .map((w) => `${w}:*`)
    .join(" & ");
}

/**
 * Smart search across Parts, Vehicles, and Listings using tsvector + ts_rank.
 */
export async function smartSearch(
  query: string,
  options: { limit?: number; offset?: number; type?: string } = {}
): Promise<SearchResponse> {
  const { limit = 20, offset = 0, type } = options;
  const tsQuery = sanitizeQuery(query);

  if (!tsQuery) {
    return { results: [], total: 0, suggestions: [] };
  }

  const results: SearchResult[] = [];
  let total = 0;

  // Search Parts
  if (!type || type === "part") {
    const parts = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        name: string;
        category: string;
        slug: string;
        price: number;
        rank: number;
        image: string | null;
      }>
    >(
      `SELECT p."id", p."name", p."category", p."slug", p."price",
              ts_rank(p."searchVector", to_tsquery('simple', $1)) AS rank,
              (SELECT pi."url" FROM "PartImage" pi WHERE pi."partId" = p."id" AND pi."isPrimary" = true LIMIT 1) AS image
       FROM "Part" p
       WHERE p."status" = 'ACTIVE'
         AND p."searchVector" @@ to_tsquery('simple', $1)
       ORDER BY rank DESC
       LIMIT $2 OFFSET $3`,
      tsQuery,
      limit,
      offset
    );

    for (const p of parts) {
      results.push({
        id: p.id,
        type: "part",
        title: p.name,
        subtitle: p.category,
        slug: `/shop/dil/${p.slug}`,
        price: p.price,
        image: p.image,
        rank: Number(p.rank),
      });
    }

    const [countResult] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM "Part"
       WHERE "status" = 'ACTIVE' AND "searchVector" @@ to_tsquery('simple', $1)`,
      tsQuery
    );
    total += Number(countResult.count);
  }

  // Search Listings
  if (!type || type === "listing") {
    const listings = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        brand: string;
        model: string;
        variant: string | null;
        year: number;
        slug: string;
        price: number;
        rank: number;
        image: string | null;
      }>
    >(
      `SELECT l."id", l."brand", l."model", l."variant", l."year", l."slug", l."price",
              ts_rank(l."searchVector", to_tsquery('simple', $1)) AS rank,
              (SELECT li."url" FROM "ListingImage" li WHERE li."listingId" = l."id" AND li."isPrimary" = true LIMIT 1) AS image
       FROM "Listing" l
       WHERE l."status" = 'ACTIVE'
         AND l."searchVector" @@ to_tsquery('simple', $1)
       ORDER BY rank DESC
       LIMIT $2 OFFSET $3`,
      tsQuery,
      limit,
      offset
    );

    for (const l of listings) {
      results.push({
        id: l.id,
        type: "listing",
        title: `${l.brand} ${l.model}${l.variant ? ` ${l.variant}` : ""}`,
        subtitle: `${l.year}`,
        slug: `/nabidka/${l.slug}`,
        price: l.price,
        image: l.image,
        rank: Number(l.rank),
      });
    }

    const [countResult] = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM "Listing"
       WHERE "status" = 'ACTIVE' AND "searchVector" @@ to_tsquery('simple', $1)`,
      tsQuery
    );
    total += Number(countResult.count);
  }

  // Sort by rank across all types
  results.sort((a, b) => b.rank - a.rank);

  // Get suggestions using trigram similarity
  const suggestions = await getSearchSuggestions(query);

  return { results: results.slice(0, limit), total, suggestions };
}

/**
 * Get autocomplete suggestions using pg_trgm similarity.
 */
export async function getSearchSuggestions(
  query: string,
  limit = 8
): Promise<string[]> {
  const cleaned = query.trim().replace(/[^\w\sáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ-]/g, "");
  if (cleaned.length < 2) return [];

  // Detekce OEM formátu: převážně alfanumerické znaky, min 4 chars
  const looksLikeOem = /^[A-Z0-9\s\-.]{4,}$/i.test(cleaned);

  const oemUnion = looksLikeOem
    ? `UNION
     (SELECT DISTINCT "oemNumber" AS suggestion FROM "Part"
      WHERE "status" = 'ACTIVE' AND "oemNumber" IS NOT NULL
        AND UPPER(REPLACE(REPLACE("oemNumber", ' ', ''), '-', ''))
            LIKE '%' || UPPER(REPLACE(REPLACE($1, ' ', ''), '-', '')) || '%'
      LIMIT $2)
     UNION
     (SELECT DISTINCT "partNumber" AS suggestion FROM "Part"
      WHERE "status" = 'ACTIVE' AND "partNumber" IS NOT NULL
        AND UPPER(REPLACE(REPLACE("partNumber", ' ', ''), '-', ''))
            LIKE '%' || UPPER(REPLACE(REPLACE($1, ' ', ''), '-', '')) || '%'
      LIMIT $2)`
    : "";

  const suggestions = await prisma.$queryRawUnsafe<Array<{ suggestion: string }>>(
    `(SELECT DISTINCT "name" AS suggestion FROM "Part"
      WHERE "status" = 'ACTIVE' AND similarity("name", $1) > 0.15
      ORDER BY similarity("name", $1) DESC
      LIMIT $2)
     ${oemUnion}
     UNION
     (SELECT DISTINCT "brand" || ' ' || "model" AS suggestion FROM "Listing"
      WHERE "status" = 'ACTIVE' AND similarity("brand" || ' ' || "model", $1) > 0.15
      ORDER BY similarity("brand" || ' ' || "model", $1) DESC
      LIMIT $2)
     LIMIT $2`,
    cleaned,
    limit
  );

  return suggestions.map((s) => s.suggestion);
}

/* ------------------------------------------------------------------ */
/*  Global cross-platform search                                        */
/* ------------------------------------------------------------------ */

export interface GlobalSearchItem {
  id: string;
  type: "vehicle" | "listing" | "part" | "service" | "broker" | "article";
  title: string;
  subtitle: string;
  url: string;
  image?: string | null;
  price?: number | null;
  rating?: number | null;
  rank: number;
}

export interface GlobalSearchResponse {
  vehicles: GlobalSearchItem[];
  parts: GlobalSearchItem[];
  services: GlobalSearchItem[];
  articles: GlobalSearchItem[];
  totalByType: Record<string, number>;
  suggestions: string[];
}

export async function globalSearch(
  query: string,
  options: { limitPerType?: number; type?: string } = {}
): Promise<GlobalSearchResponse> {
  const { limitPerType = 5, type = "all" } = options;
  const tsQuery = sanitizeQuery(query);

  if (!tsQuery) {
    return { vehicles: [], parts: [], services: [], articles: [], totalByType: {}, suggestions: [] };
  }

  const [vehicles, listings, parts, services, articles] = await Promise.all([
    type === "all" || type === "vehicles" ? searchVehiclesGlobal(tsQuery, limitPerType) : [],
    type === "all" || type === "vehicles" ? searchListingsGlobal(tsQuery, limitPerType) : [],
    type === "all" || type === "parts" ? searchPartsGlobal(tsQuery, limitPerType) : [],
    type === "all" || type === "services" ? searchServicesGlobal(tsQuery, limitPerType) : [],
    type === "all" || type === "articles" ? searchArticlesGlobal(tsQuery, limitPerType) : [],
  ]);

  // Merge vehicles + listings, sort by rank, limit
  const mergedVehicles = [...vehicles, ...listings]
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limitPerType);

  const suggestions = await getSearchSuggestions(query);

  return {
    vehicles: mergedVehicles,
    parts,
    services,
    articles,
    totalByType: {
      vehicles: vehicles.length + listings.length,
      parts: parts.length,
      services: services.length,
      articles: articles.length,
    },
    suggestions,
  };
}

async function searchVehiclesGlobal(tsQuery: string, limit: number): Promise<GlobalSearchItem[]> {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      brand: string;
      model: string;
      variant: string | null;
      year: number;
      mileage: number;
      slug: string | null;
      rank: number;
      image: string | null;
    }>
  >(
    `SELECT v."id", v."brand", v."model", v."variant", v."year", v."mileage", v."slug",
            ts_rank(v."searchVector", to_tsquery('simple', $1)) AS rank,
            (SELECT vi."url" FROM "VehicleImage" vi WHERE vi."vehicleId" = v."id" AND vi."isPrimary" = true LIMIT 1) AS image
     FROM "Vehicle" v
     WHERE v."status" = 'ACTIVE'
       AND v."slug" IS NOT NULL
       AND v."searchVector" @@ to_tsquery('simple', $1)
     ORDER BY rank DESC
     LIMIT $2`,
    tsQuery,
    limit
  );

  return rows.map((v) => ({
    id: v.id,
    type: "vehicle" as const,
    title: `${v.brand} ${v.model}${v.variant ? ` ${v.variant}` : ""}`,
    subtitle: `${v.year} · ${v.mileage.toLocaleString("cs-CZ")} km`,
    url: `/nabidka/${v.slug}`,
    image: v.image,
    rank: Number(v.rank),
  }));
}

async function searchListingsGlobal(tsQuery: string, limit: number): Promise<GlobalSearchItem[]> {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      brand: string;
      model: string;
      variant: string | null;
      year: number;
      slug: string;
      price: number;
      rank: number;
      image: string | null;
    }>
  >(
    `SELECT l."id", l."brand", l."model", l."variant", l."year", l."slug", l."price",
            ts_rank(l."searchVector", to_tsquery('simple', $1)) AS rank,
            (SELECT li."url" FROM "ListingImage" li WHERE li."listingId" = l."id" AND li."isPrimary" = true LIMIT 1) AS image
     FROM "Listing" l
     WHERE l."status" = 'ACTIVE'
       AND l."searchVector" @@ to_tsquery('simple', $1)
     ORDER BY rank DESC
     LIMIT $2`,
    tsQuery,
    limit
  );

  return rows.map((l) => ({
    id: l.id,
    type: "listing" as const,
    title: `${l.brand} ${l.model}${l.variant ? ` ${l.variant}` : ""}`,
    subtitle: `${l.year} · ${l.price.toLocaleString("cs-CZ")} Kč`,
    url: `/nabidka/${l.slug}`,
    image: l.image,
    price: l.price,
    rank: Number(l.rank),
  }));
}

async function searchPartsGlobal(tsQuery: string, limit: number): Promise<GlobalSearchItem[]> {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string;
      category: string;
      slug: string;
      price: number;
      rank: number;
      image: string | null;
    }>
  >(
    `SELECT p."id", p."name", p."category", p."slug", p."price",
            ts_rank(p."searchVector", to_tsquery('simple', $1)) AS rank,
            (SELECT pi."url" FROM "PartImage" pi WHERE pi."partId" = p."id" AND pi."isPrimary" = true LIMIT 1) AS image
     FROM "Part" p
     WHERE p."status" = 'ACTIVE'
       AND p."searchVector" @@ to_tsquery('simple', $1)
     ORDER BY rank DESC
     LIMIT $2`,
    tsQuery,
    limit
  );

  return rows.map((p) => ({
    id: p.id,
    type: "part" as const,
    title: p.name,
    subtitle: `${p.price.toLocaleString("cs-CZ")} Kč`,
    url: `/shop/dil/${p.slug}`,
    image: p.image,
    price: p.price,
    rank: Number(p.rank),
  }));
}

async function searchServicesGlobal(tsQuery: string, limit: number): Promise<GlobalSearchItem[]> {
  // AutoServis doesn't have tsvector yet (Fáze 2), use ILIKE fallback
  const cleaned = tsQuery.replace(/:?\*/g, "").replace(/\s*&\s*/g, " ").trim();
  if (!cleaned) return [];

  const rows = await prisma.autoServis.findMany({
    where: {
      isPublished: true,
      OR: [
        { name: { contains: cleaned, mode: "insensitive" } },
        { city: { contains: cleaned, mode: "insensitive" } },
        { description: { contains: cleaned, mode: "insensitive" } },
      ],
    },
    orderBy: { averageRating: "desc" },
    take: limit,
  });

  return rows.map((s) => ({
    id: s.id,
    type: "service" as const,
    title: s.name,
    subtitle: `${s.city} · ${s.averageRating > 0 ? `★ ${s.averageRating.toFixed(1)}` : "Nový"}`,
    url: `/autoservisy/${s.slug}`,
    image: s.logo,
    rating: s.averageRating,
    rank: 0.1,
  }));
}

async function searchArticlesGlobal(tsQuery: string, limit: number): Promise<GlobalSearchItem[]> {
  const cleaned = tsQuery.replace(/:?\*/g, "").replace(/\s*&\s*/g, " ").trim();
  if (!cleaned) return [];

  const rows = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: cleaned, mode: "insensitive" } },
        { excerpt: { contains: cleaned, mode: "insensitive" } },
      ],
    },
    include: { category: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  return rows.map((a) => ({
    id: a.id,
    type: "article" as const,
    title: a.title,
    subtitle: a.category?.name ?? "Blog",
    url: `/blog/${a.slug}`,
    image: a.coverImage,
    rank: 0.1,
  }));
}

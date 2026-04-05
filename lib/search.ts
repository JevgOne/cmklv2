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

  const suggestions = await prisma.$queryRawUnsafe<Array<{ suggestion: string }>>(
    `(SELECT DISTINCT "name" AS suggestion FROM "Part"
      WHERE "status" = 'ACTIVE' AND similarity("name", $1) > 0.15
      ORDER BY similarity("name", $1) DESC
      LIMIT $2)
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

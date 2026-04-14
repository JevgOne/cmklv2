import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/parts/autocomplete?q=XXX — rich autocomplete suggestions  */
/*  Returns sections: parts, categories, vehicles, OEM                 */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ sections: { parts: [], categories: [], vehicles: [], oem: [] }, total: 0 });
  }

  const looksLikeOem = /^[A-Z0-9\s\-.]{4,}$/i.test(q);
  const pattern = `%${q}%`;

  try {
    const [parts, categories, vehicles, oem] = await Promise.all([
      // Top 3 parts by name match
      prisma.part.findMany({
        where: { status: "ACTIVE", name: { contains: q, mode: "insensitive" } },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          manufacturer: true,
          stock: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
        orderBy: { viewCount: "desc" },
        take: 3,
      }),

      // Top 2 categories with part counts
      prisma.$queryRaw<Array<{ slug: string; count: bigint }>>`
        SELECT category AS slug, COUNT(*)::bigint AS count
        FROM "Part"
        WHERE status = 'ACTIVE'
          AND (name ILIKE ${pattern} OR category ILIKE ${pattern})
        GROUP BY category
        ORDER BY count DESC
        LIMIT 2
      `,

      // Top 3 vehicle brand+model combinations
      prisma.$queryRaw<Array<{ brand: string | null; model: string | null; count: bigint }>>`
        SELECT
          "compatibleBrands"::text AS brand,
          "compatibleModels"::text AS model,
          COUNT(*)::bigint AS count
        FROM "Part"
        WHERE status = 'ACTIVE'
          AND ("compatibleBrands"::text ILIKE ${pattern}
               OR "compatibleModels"::text ILIKE ${pattern})
        GROUP BY "compatibleBrands"::text, "compatibleModels"::text
        HAVING "compatibleBrands" IS NOT NULL
        ORDER BY count DESC
        LIMIT 3
      `,

      // OEM number matches (only if query looks like OEM)
      looksLikeOem
        ? prisma.$queryRaw<Array<{ number: string; partCount: bigint; cheapestPrice: number }>>`
            SELECT "oemNumber" AS number, COUNT(*)::bigint AS "partCount",
                   MIN(price) AS "cheapestPrice"
            FROM "Part"
            WHERE status = 'ACTIVE' AND "oemNumber" IS NOT NULL
              AND UPPER(REPLACE(REPLACE("oemNumber", ' ', ''), '-', ''))
                  ILIKE ${`%${q.replace(/[\s\-.]/g, "").toUpperCase()}%`}
            GROUP BY "oemNumber"
            ORDER BY "partCount" DESC
            LIMIT 2
          `
        : ([] as Array<{ number: string; partCount: bigint; cheapestPrice: number }>),
    ]);

    // Serialize BigInts from raw queries
    const serializeCount = (v: bigint | number) => Number(v);

    const result = {
      sections: {
        parts: parts.map((p) => ({
          ...p,
          image: p.images[0]?.url ?? null,
          images: undefined,
        })),
        categories: categories.map((c) => ({
          slug: c.slug,
          label: c.slug,
          count: serializeCount(c.count),
        })),
        vehicles: vehicles.map((v) => ({
          brand: v.brand,
          model: v.model,
          count: serializeCount(v.count),
        })),
        oem: oem.map((o) => ({
          number: o.number,
          partCount: serializeCount(o.partCount),
          cheapestPrice: o.cheapestPrice,
        })),
      },
      total:
        parts.length + categories.length + vehicles.length + oem.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/parts/autocomplete error:", error);
    return NextResponse.json(
      { sections: { parts: [], categories: [], vehicles: [], oem: [] }, total: 0 },
    );
  }
}

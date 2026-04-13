import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/parts/oem-lookup?q=06B103925 — OEM křížové reference       */
/*  Hledá v Part.oemNumber i Part.partNumber s normalizací na DB straně */
/* ------------------------------------------------------------------ */

function normalizeOem(str: string): string {
  return str.replace(/[\s\-.]/g, "").toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const query = params.get("q")?.trim() ?? "";
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(params.get("limit") || "20", 10));

    if (query.length < 3) {
      return NextResponse.json({ parts: [], total: 0, page, totalPages: 0 });
    }

    const normalized = normalizeOem(query);
    const likePattern = `%${normalized}%`;
    const offset = (page - 1) * limit;

    // Normalizace na DB straně: strip mezery, pomlčky, tečky z oemNumber/partNumber
    // pak ILIKE porovnání s normalizovaným inputem
    const DB_NORMALIZE = `UPPER(REPLACE(REPLACE(REPLACE(`;
    const DB_NORMALIZE_END = `, ' ', ''), '-', ''), '.', ''))`;

    const whereClause = `
      "status" = 'ACTIVE'
      AND (
        ${DB_NORMALIZE}"oemNumber"${DB_NORMALIZE_END} ILIKE $1
        OR ${DB_NORMALIZE}"partNumber"${DB_NORMALIZE_END} ILIKE $1
      )
    `;

    const [ids, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT "id" FROM "Part"
         WHERE ${whereClause}
         ORDER BY "price" ASC
         LIMIT $2 OFFSET $3`,
        likePattern,
        limit,
        offset,
      ),
      prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM "Part" WHERE ${whereClause}`,
        likePattern,
      ),
    ]);

    const total = Number(countResult[0].count);

    // Fetch full part data via Prisma for type safety and relations
    const parts =
      ids.length > 0
        ? await prisma.part.findMany({
            where: { id: { in: ids.map((r) => r.id) } },
            select: {
              id: true,
              name: true,
              slug: true,
              oemNumber: true,
              partNumber: true,
              manufacturer: true,
              price: true,
              stock: true,
              condition: true,
              partType: true,
              compatibleBrands: true,
              compatibleModels: true,
              images: { select: { url: true }, take: 1, orderBy: { order: "asc" } },
            },
            orderBy: { price: "asc" },
          })
        : [];

    return NextResponse.json({
      parts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/parts/oem-lookup error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

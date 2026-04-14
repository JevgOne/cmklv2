import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseNaturalQuery } from "@/lib/search-parser";

/* ------------------------------------------------------------------ */
/*  GET /api/parts/smart-search?q=XXX — NLP-enhanced part search       */
/*  Parses natural queries like "brzdové destičky octavia 2017"        */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(50, parseInt(request.nextUrl.searchParams.get("limit") || "20", 10));

  if (q.length < 2) {
    return NextResponse.json({ parts: [], parsed: { keywords: [] }, total: 0 });
  }

  const parsed = parseNaturalQuery(q);

  // Build Prisma where from parsed query
  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (parsed.category) {
    where.category = parsed.category;
  }

  if (parsed.brand) {
    where.compatibleBrands = { has: parsed.brand };
  }

  if (parsed.model) {
    where.compatibleModels = { has: parsed.model };
  }

  if (parsed.year) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { OR: [{ compatibleYearFrom: null }, { compatibleYearFrom: { lte: parsed.year } }] },
      { OR: [{ compatibleYearTo: null }, { compatibleYearTo: { gte: parsed.year } }] },
    ];
  }

  if (parsed.oemNumber) {
    where.OR = [
      { oemNumber: { contains: parsed.oemNumber, mode: "insensitive" } },
      { partNumber: { contains: parsed.oemNumber, mode: "insensitive" } },
    ];
  } else if (parsed.keywords.length > 0) {
    // Fulltext search on keywords
    const keywordPattern = parsed.keywords.join(" ");
    where.name = { contains: keywordPattern, mode: "insensitive" };
  }

  try {
    const parts = await prisma.part.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        category: true,
        condition: true,
        manufacturer: true,
        compatibleBrands: true,
        compatibleModels: true,
        compatibleYearFrom: true,
        compatibleYearTo: true,
        viewCount: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      orderBy: { viewCount: "desc" },
      take: limit,
    });

    return NextResponse.json({
      parts: parts.map((p) => ({
        ...p,
        image: p.images[0]?.url ?? null,
        images: undefined,
      })),
      parsed,
      total: parts.length,
    });
  } catch (error) {
    console.error("GET /api/parts/smart-search error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

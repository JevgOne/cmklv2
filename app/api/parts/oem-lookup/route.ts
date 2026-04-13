import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/parts/oem-lookup?q=06B103925 — OEM křížové reference       */
/*  Hledá v Part.oemNumber i Part.partNumber s normalizací              */
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

    // Hledáme jak normalizovanou verzi, tak originální (s mezerami/pomlčkami)
    const where = {
      status: "ACTIVE" as const,
      OR: [
        { oemNumber: { contains: normalized, mode: "insensitive" as const } },
        { partNumber: { contains: normalized, mode: "insensitive" as const } },
        { oemNumber: { contains: query, mode: "insensitive" as const } },
        { partNumber: { contains: query, mode: "insensitive" as const } },
      ],
    };

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.part.count({ where }),
    ]);

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

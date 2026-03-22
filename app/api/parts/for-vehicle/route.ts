import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/parts/for-vehicle                                         */
/*  Query params: brand, model, year, limit (default 6)                */
/*  Vrací díly kompatibilní s daným vozidlem.                          */
/* ------------------------------------------------------------------ */

const querySchema = z.object({
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const parsed = querySchema.safeParse({
      brand: params.get("brand"),
      model: params.get("model"),
      year: params.get("year") || undefined,
      limit: params.get("limit") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatné parametry", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { brand, model, year, limit } = parsed.data;

    // Sestavení where podmínky:
    // Díl je kompatibilní, pokud:
    //   1) je universalFit, nebo
    //   2) compatibleBrands obsahuje brand A compatibleModels obsahuje model
    // + rok musí být v rozmezí compatibleYearFrom..compatibleYearTo (pokud je zadáno)
    const brandModelCondition: Record<string, unknown> = {
      compatibleBrands: { contains: brand },
      compatibleModels: { contains: model },
    };

    const where: Record<string, unknown> = {
      status: "ACTIVE",
      stock: { gt: 0 },
      OR: [
        { universalFit: true },
        brandModelCondition,
      ],
    };

    // Filtr podle roku výroby
    if (year) {
      where.AND = [
        { OR: [{ compatibleYearFrom: null }, { compatibleYearFrom: { lte: year } }] },
        { OR: [{ compatibleYearTo: null }, { compatibleYearTo: { gte: year } }] },
      ];
    }

    const [parts, totalCount] = await Promise.all([
      prisma.part.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          partType: true,
          condition: true,
          stock: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
        orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
      prisma.part.count({ where }),
    ]);

    const formattedParts = parts.map((part) => ({
      id: part.id,
      slug: part.slug,
      name: part.name,
      price: part.price,
      partType: part.partType,
      condition: part.condition,
      stock: part.stock,
      image: part.images[0]?.url || null,
    }));

    return NextResponse.json({ parts: formattedParts, totalCount });
  } catch (error) {
    console.error("GET /api/parts/for-vehicle error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

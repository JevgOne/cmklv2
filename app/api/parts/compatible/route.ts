import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/parts/compatible — Díly kompatibilní s vozem               */
/*  ?vin=XXX nebo ?brand=X&model=Y&year=Z                              */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const vin = params.get("vin");
    const brand = params.get("brand");
    const model = params.get("model");
    const yearStr = params.get("year");

    if (!vin && !brand) {
      return NextResponse.json(
        { error: "Zadejte VIN nebo značku vozu" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { status: "ACTIVE" };

    // Normalize diacritics for search
    const removeDiacritics = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (vin) {
      // VIN-based: hledej díly kde je VIN zdrojového vozu nebo universal fit
      // V reálné aplikaci bychom VIN dekódovali na brand/model/year
      // Pro MVP hledáme universal fit nebo díly s libovolnou kompatibilitou
      where.OR = [{ universalFit: true }];
    } else {
      // Brand/model/year filtr
      const conditions: Record<string, unknown>[] = [{ universalFit: true }];

      const brandModelCondition: Record<string, unknown> = {};
      if (brand) {
        const normalizedBrand = removeDiacritics(brand);
        brandModelCondition.compatibleBrands = {
          contains: normalizedBrand,
          mode: "insensitive",
        };
      }
      if (model) {
        const normalizedModel = removeDiacritics(model);
        brandModelCondition.compatibleModels = {
          contains: normalizedModel,
          mode: "insensitive",
        };
      }
      conditions.push(brandModelCondition);

      where.OR = conditions;

      if (yearStr) {
        const year = parseInt(yearStr, 10);
        if (!isNaN(year)) {
          where.AND = [
            { OR: [{ compatibleYearFrom: null }, { compatibleYearFrom: { lte: year } }] },
            { OR: [{ compatibleYearTo: null }, { compatibleYearTo: { gte: year } }] },
          ];
        }
      }
    }

    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, parseInt(params.get("limit") || "18", 10));
    const skip = (page - 1) * limit;

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          supplier: {
            select: { id: true, firstName: true, lastName: true, companyName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
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
    console.error("GET /api/parts/compatible error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

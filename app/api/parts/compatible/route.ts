import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decodeVin } from "@/lib/vin-decoder";

/* ------------------------------------------------------------------ */
/*  GET /api/parts/compatible — Díly kompatibilní s vozem               */
/*  ?vin=XXX nebo ?brand=X&model=Y&year=Z                              */
/* ------------------------------------------------------------------ */

// In-memory cache pro decoded VINy (přežije po dobu běhu procesu)
const vinCache = new Map<string, { brand?: string; model?: string; year?: number; cachedAt: number }>();
const VIN_CACHE_TTL = 1000 * 60 * 60; // 1 hodina

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const vin = params.get("vin");
    let brand = params.get("brand");
    let model = params.get("model");
    let yearStr = params.get("year");

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

    // VIN decode → brand/model/year
    if (vin) {
      const normalized = vin.toUpperCase().trim();
      let decoded = vinCache.get(normalized);

      if (!decoded || Date.now() - decoded.cachedAt > VIN_CACHE_TTL) {
        try {
          const result = await decodeVin(normalized);
          decoded = {
            brand: result.brand,
            model: result.model,
            year: result.year,
            cachedAt: Date.now(),
          };
          vinCache.set(normalized, decoded);
        } catch (err) {
          console.warn("VIN decode selhalo, fallback na universalFit:", err);
          decoded = undefined;
        }
      }

      if (decoded?.brand) {
        brand = decoded.brand;
        model = decoded.model ?? null;
        yearStr = decoded.year?.toString() ?? null;
      } else {
        // Fallback — VIN decode selhal, vrátíme jen universal fit díly
        where.OR = [{ universalFit: true }];
      }
    }

    // Brand/model/year filtr (platí pro přímé params i pro VIN-decoded hodnoty)
    if (brand) {
      const conditions: Record<string, unknown>[] = [{ universalFit: true }];

      const brandModelCondition: Record<string, unknown> = {};
      const normalizedBrand = removeDiacritics(brand);
      brandModelCondition.compatibleBrands = {
        contains: normalizedBrand,
        mode: "insensitive",
      };
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

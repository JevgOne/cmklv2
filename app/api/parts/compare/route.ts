import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/parts/compare?oemNumber=XXX — OEM cross-reference search  */
/*  Returns original, aftermarket, and used alternatives.              */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  const rawOem = request.nextUrl.searchParams.get("oemNumber")?.trim();
  if (!rawOem || rawOem.length < 3) {
    return NextResponse.json({ error: "OEM číslo je povinné (min 3 znaky)" }, { status: 400 });
  }

  // Normalizovat: strip spaces + dashes pro fuzzy match
  const normalizedOem = rawOem.replace(/[\s\-]/g, "").toUpperCase();

  try {
    // 1. Najít cross-references
    const crossRefs = await prisma.partCrossReference.findMany({
      where: {
        OR: [
          { oemNumber: { contains: rawOem, mode: "insensitive" } },
          { aftermarketNumber: { contains: rawOem, mode: "insensitive" } },
        ],
      },
      include: {
        part: {
          select: {
            id: true, name: true, slug: true, price: true, stock: true,
            manufacturer: true, warranty: true, condition: true, partType: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
      },
      take: 20,
    });

    // 2. Najít díly přímo (OEM match v katalogu)
    const directParts = await prisma.part.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { oemNumber: { contains: rawOem, mode: "insensitive" } },
          { partNumber: { contains: rawOem, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, name: true, slug: true, price: true, stock: true,
        manufacturer: true, warranty: true, condition: true, partType: true,
        oemNumber: true, partNumber: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
      take: 20,
    });

    // 3. Sestavit alternatives list
    const seenPartIds = new Set<string>();
    const alternatives: Array<{
      type: "ORIGINAL" | "AFTERMARKET" | "USED";
      part?: Record<string, unknown>;
      crossRef?: { aftermarketNumber: string; manufacturer: string };
    }> = [];

    // Direct catalog parts
    for (const p of directParts) {
      if (seenPartIds.has(p.id)) continue;
      seenPartIds.add(p.id);
      const type = p.partType === "USED" ? "USED" as const
        : p.partType === "AFTERMARKET" ? "AFTERMARKET" as const
        : "ORIGINAL" as const;
      alternatives.push({
        type,
        part: { ...p, image: p.images[0]?.url ?? null, images: undefined },
      });
    }

    // Cross-reference parts
    for (const ref of crossRefs) {
      if (ref.part && !seenPartIds.has(ref.part.id)) {
        seenPartIds.add(ref.part.id);
        alternatives.push({
          type: "AFTERMARKET",
          part: { ...ref.part, image: ref.part.images[0]?.url ?? null, images: undefined },
          crossRef: { aftermarketNumber: ref.aftermarketNumber, manufacturer: ref.manufacturer },
        });
      } else if (!ref.part) {
        // Cross-ref without catalog part
        alternatives.push({
          type: "AFTERMARKET",
          crossRef: { aftermarketNumber: ref.aftermarketNumber, manufacturer: ref.manufacturer },
        });
      }
    }

    // Sort: ORIGINAL → AFTERMARKET → USED, then by price
    const typeOrder = { ORIGINAL: 0, AFTERMARKET: 1, USED: 2 };
    alternatives.sort((a, b) => {
      const orderDiff = typeOrder[a.type] - typeOrder[b.type];
      if (orderDiff !== 0) return orderDiff;
      const priceA = (a.part as Record<string, number> | undefined)?.price ?? Infinity;
      const priceB = (b.part as Record<string, number> | undefined)?.price ?? Infinity;
      return priceA - priceB;
    });

    return NextResponse.json({
      oemNumber: rawOem,
      alternatives,
    });
  } catch (error) {
    console.error("GET /api/parts/compare error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

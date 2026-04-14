import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateShipmentWeight } from "@/lib/shipping/weight";
import { getShippingMethods } from "@/lib/shipping/prices";
import { z } from "zod";

const calculateSchema = z.object({
  items: z
    .array(z.object({ partId: z.string().min(1), quantity: z.number().int().min(1) }))
    .min(1, "Prázdný košík"),
});

/** Limity dopravců — max váha (kg) a max rozměr (cm) */
const CARRIER_LIMITS: Record<string, { maxWeightKg: number; maxDimensionCm: number }> = {
  ZASILKOVNA:  { maxWeightKg: 10,       maxDimensionCm: 70 },
  DPD:         { maxWeightKg: 31.5,     maxDimensionCm: 175 },
  PPL:         { maxWeightKg: 31.5,     maxDimensionCm: 200 },
  GLS:         { maxWeightKg: 40,       maxDimensionCm: 200 },
  CESKA_POSTA: { maxWeightKg: 30,       maxDimensionCm: 240 },
  PICKUP:      { maxWeightKg: Infinity, maxDimensionCm: Infinity },
};

/** Parsuje dimensions string → pole čísel (cm). Formáty: "60x40x30", "60×40×30", JSON {l,w,h} */
function parseDimensions(dim: string): number[] {
  if (typeof dim === "string" && /[\dx×]/i.test(dim)) {
    return dim.split(/[x×]/i).map(Number).filter((n) => !isNaN(n) && n > 0);
  }
  try {
    const parsed = JSON.parse(dim);
    return [parsed.l ?? 0, parsed.w ?? 0, parsed.h ?? 0].filter((n) => n > 0);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/shipping/calculate — dostupné metody + omezení           */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = calculateSchema.parse(body);

    const partIds = data.items.map((i) => i.partId);
    const parts = await prisma.part.findMany({
      where: { id: { in: partIds } },
      select: { id: true, weight: true, dimensions: true },
    });

    const totalWeight = await calculateShipmentWeight(data.items);

    // Maximální rozměr ze všech dílů
    let maxDimension = 0;
    for (const part of parts) {
      if (part.dimensions) {
        const dims = parseDimensions(part.dimensions);
        if (dims.length > 0) {
          maxDimension = Math.max(maxDimension, ...dims);
        }
      }
    }

    // Vyhodnotit dostupnost per metoda
    const methods = getShippingMethods().map((info) => {
      const limits = CARRIER_LIMITS[info.method];
      let available = true;
      let unavailableReason: string | undefined;

      if (limits) {
        if (totalWeight > limits.maxWeightKg) {
          available = false;
          unavailableReason = `Zásilka přesahuje ${limits.maxWeightKg} kg — ${info.label} nedostupná`;
        } else if (maxDimension > 0 && maxDimension > limits.maxDimensionCm) {
          available = false;
          unavailableReason = `Rozměr přesahuje ${limits.maxDimensionCm} cm — ${info.label} nedostupná`;
        }
      }

      return {
        method: info.method,
        label: info.label,
        description: info.description,
        eta: info.eta,
        price: info.price,
        available,
        unavailableReason,
      };
    });

    return NextResponse.json({ methods, totalWeight, maxDimension });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/shipping/calculate error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

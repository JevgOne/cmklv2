import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decodeVin } from "@/lib/vin-decoder";

const vinSchema = z.string().regex(
  /^[A-HJ-NPR-Z0-9]{17}$/,
  "VIN musí mít 17 znaků a platný formát (bez I, O, Q)"
);

export async function GET(request: NextRequest) {
  // Extrahovat VIN z query params předem (pro graceful fallback v catch)
  const { searchParams } = new URL(request.url);
  const rawVin = searchParams.get("vin")?.toUpperCase().trim();

  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    if (!rawVin) {
      return NextResponse.json(
        { error: "Parametr vin je povinný" },
        { status: 400 }
      );
    }

    // Validace
    const parseResult = vinSchema.safeParse(rawVin);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    // Dekódování (nikdy nethrowuje — vrátí alespoň { vin })
    const result = await decodeVin(parseResult.data);

    return NextResponse.json({
      data: result,
      // Flag pro klienta: pokud API nevrátilo brand, je potřeba manuální zadání
      manual: !result.brand,
    });
  } catch (error) {
    console.error("GET /api/vin/decode error:", error);

    // Graceful degradation — nikdy nevracet 500, vždy umožnit manuální zadání
    return NextResponse.json(
      { data: { vin: rawVin ?? "" }, manual: true },
      { status: 200 }
    );
  }
}

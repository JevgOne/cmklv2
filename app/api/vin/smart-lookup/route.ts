import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionOrMobileToken } from "@/lib/auth-mobile";
import { prisma } from "@/lib/prisma";
import { decodeWithVincario, decodeWithNhtsa } from "@/lib/vin-decoder";
import { orderCebiaReport } from "@/lib/cebia";
import { mergeVinSources } from "@/lib/vin-merge";
import type { VinDecoderResult } from "@/types/vehicle-draft";
import type { DbVehicleData } from "@/lib/vin-merge";

const vinSchema = z.string().regex(
  /^[A-HJ-NPR-Z0-9]{17}$/,
  "VIN musí mít 17 znaků a platný formát (bez I, O, Q)"
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawVin = searchParams.get("vin")?.toUpperCase().trim();

  try {
    // Auth check
    const session = await getSessionOrMobileToken(request);
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

    const vin = parseResult.data;

    // ============================================
    // Pipeline: DB → CEBIA → Vincario → NHTSA
    // Each source can fail independently
    // ============================================

    // [1] DB Vehicle lookup (archived vehicles = reusable data)
    let dbData: DbVehicleData | null = null;
    try {
      const dbVehicle = await prisma.vehicle.findUnique({
        where: { vin },
        select: {
          id: true,
          brand: true,
          model: true,
          variant: true,
          year: true,
          mileage: true,
          fuelType: true,
          transmission: true,
          enginePower: true,
          engineCapacity: true,
          bodyType: true,
          color: true,
          doorsCount: true,
          seatsCount: true,
          drivetrain: true,
          condition: true,
          ownerCount: true,
          status: true,
        },
      });

      if (dbVehicle && dbVehicle.status === "ARCHIVED") {
        dbData = {
          id: dbVehicle.id,
          brand: dbVehicle.brand,
          model: dbVehicle.model,
          variant: dbVehicle.variant,
          year: dbVehicle.year,
          mileage: dbVehicle.mileage,
          fuelType: dbVehicle.fuelType,
          transmission: dbVehicle.transmission,
          enginePower: dbVehicle.enginePower,
          engineCapacity: dbVehicle.engineCapacity,
          bodyType: dbVehicle.bodyType,
          color: dbVehicle.color,
          doorsCount: dbVehicle.doorsCount,
          seatsCount: dbVehicle.seatsCount,
          drivetrain: dbVehicle.drivetrain,
          condition: dbVehicle.condition,
          ownerCount: dbVehicle.ownerCount,
        };
      }
    } catch (err) {
      console.warn("[smart-lookup] DB lookup failed:", err);
    }

    // [2] CEBIA + [3] Vincario run in parallel
    const apiKey = process.env.VINDECODER_API_KEY;
    const apiSecret = process.env.VINDECODER_API_SECRET;

    const [cebiaResult, vincarioResult] = await Promise.allSettled([
      // CEBIA
      orderCebiaReport(vin),
      // Vincario
      apiKey && apiSecret
        ? decodeWithVincario(vin, apiKey, apiSecret)
        : Promise.resolve(null),
    ]);

    const cebiaData =
      cebiaResult.status === "fulfilled" ? cebiaResult.value : null;
    const vincarioData =
      vincarioResult.status === "fulfilled"
        ? (vincarioResult.value as VinDecoderResult | null)
        : null;

    // [4] NHTSA fallback — only if Vincario didn't return brand
    let nhtsaData: VinDecoderResult | null = null;
    if (!vincarioData?.brand) {
      try {
        nhtsaData = await decodeWithNhtsa(vin);
      } catch (err) {
        console.warn("[smart-lookup] NHTSA decode failed:", err);
      }
    }

    // Merge all sources
    const result = mergeVinSources({
      dbData,
      cebiaData,
      vincarioData,
      nhtsaData,
    });

    // Flag for client: incomplete if missing critical fields
    const hasBrand = !!result.fields.brand;
    const hasModel = !!result.fields.model;
    const isIncomplete = !hasBrand || !hasModel;

    return NextResponse.json({
      ...result,
      manual: isIncomplete,
      message: isIncomplete
        ? "VIN byl částečně rozpoznán. Doplňte prosím chybějící údaje ručně."
        : undefined,
    });
  } catch (error) {
    console.error("GET /api/vin/smart-lookup error:", error);

    // Graceful degradation — return empty result, allow manual entry
    return NextResponse.json(
      {
        fields: {},
        sources: [],
        manual: true,
        message: "Nepodařilo se dekódovat VIN. Údaje vyplňte ručně.",
      },
      { status: 200 }
    );
  }
}

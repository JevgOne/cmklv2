import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createSecretHash,
  decodeWithVincario,
  decodeWithNhtsa,
  normalizeVincario,
  normalizeNhtsa,
  decodeYearFromVin,
} from "@/lib/vin-decoder";

const vinSchema = z.string().regex(
  /^[A-HJ-NPR-Z0-9]{17}$/,
  "VIN musí mít 17 znaků a platný formát (bez I, O, Q)"
);

export async function GET(request: NextRequest) {
  try {
    // Auth: ADMIN only
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const rawVin = new URL(request.url).searchParams.get("vin")?.toUpperCase().trim();
    if (!rawVin) {
      return NextResponse.json({ error: "Parametr vin je povinný" }, { status: 400 });
    }

    const parseResult = vinSchema.safeParse(rawVin);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const vin = parseResult.data;
    const apiKey = process.env.VINDECODER_API_KEY;
    const apiSecret = process.env.VINDECODER_API_SECRET;

    // 1. Vincario raw test
    let vincarioResult: Record<string, unknown> = {
      status: "SKIPPED",
      reason: "No credentials",
    };
    if (apiKey && apiSecret) {
      try {
        const secretHash = createSecretHash(vin, apiKey, apiSecret);
        const url = `https://api.vincario.com/3.2/${apiKey}/${secretHash}/decode/${vin}.json`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const raw = await res.json();
        vincarioResult = {
          status: res.status,
          responseKeys: Object.keys(raw),
          decodeType: Array.isArray(raw.decode) ? "array" : typeof raw.decode,
          decodeLength: Array.isArray(raw.decode) ? raw.decode.length : 0,
          labels: Array.isArray(raw.decode)
            ? raw.decode.map((e: { label: string }) => e.label)
            : [],
          sampleEntries: Array.isArray(raw.decode) ? raw.decode.slice(0, 5) : raw.decode,
          parsed: normalizeVincario(vin, raw),
        };
      } catch (err) {
        vincarioResult = { status: "ERROR", error: String(err) };
      }
    }

    // 2. NHTSA raw test
    let nhtsaResult: Record<string, unknown>;
    try {
      const nhtsaRes = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`
      );
      const nhtsaRaw = await nhtsaRes.json();
      nhtsaResult = {
        status: nhtsaRes.status,
        errorCode: nhtsaRaw.Results?.[0]?.ErrorCode,
        make: nhtsaRaw.Results?.[0]?.Make,
        model: nhtsaRaw.Results?.[0]?.Model,
        year: nhtsaRaw.Results?.[0]?.ModelYear,
        parsed: normalizeNhtsa(vin, nhtsaRaw),
      };
    } catch (err) {
      nhtsaResult = { status: "ERROR", error: String(err) };
    }

    return NextResponse.json({
      vin,
      env: {
        hasVindecoderKey: !!apiKey,
        hasVindecoderSecret: !!apiSecret,
        keyLength: apiKey?.length ?? 0,
        hasCebiaKey: !!process.env.CEBIA_API_KEY,
      },
      vincario: vincarioResult,
      nhtsa: nhtsaResult,
      vinPosition10: {
        char: vin[9],
        decodedYear: decodeYearFromVin(vin),
      },
      isEuropeanVin: vin.substring(3, 6) === "ZZZ",
    });
  } catch (error) {
    console.error("GET /api/vin/diagnose error:", error);
    return NextResponse.json(
      { error: "Diagnostika selhala" },
      { status: 500 }
    );
  }
}

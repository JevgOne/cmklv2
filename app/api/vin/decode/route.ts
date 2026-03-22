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
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen. Přihlaste se." },
        { status: 401 }
      );
    }

    // Query param
    const { searchParams } = new URL(request.url);
    const rawVin = searchParams.get("vin")?.toUpperCase().trim();

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

    // Dekódování
    const result = await decodeVin(parseResult.data);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("GET /api/vin/decode error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Dekódování VIN trvalo příliš dlouho. Zkuste to znovu." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Chyba při dekódování VIN" },
      { status: 500 }
    );
  }
}

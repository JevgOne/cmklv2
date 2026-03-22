import { NextRequest, NextResponse } from "next/server";
import { verifyIco } from "@/lib/ares";

/**
 * GET /api/auth/register/ares?ico=12345678
 * Ověření IČO přes ARES API
 */
export async function GET(request: NextRequest) {
  const ico = request.nextUrl.searchParams.get("ico");

  if (!ico) {
    return NextResponse.json(
      { error: "Parametr 'ico' je povinný" },
      { status: 400 }
    );
  }

  try {
    const result = await verifyIco(ico);

    if (!result) {
      return NextResponse.json(
        { error: "IČO nebylo nalezeno v registru ARES", valid: false },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("ARES API error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se ověřit IČO. Zkuste to prosím znovu." },
      { status: 500 }
    );
  }
}

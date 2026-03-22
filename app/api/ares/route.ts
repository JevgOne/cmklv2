import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyIco } from "@/lib/ares";

const querySchema = z.object({
  ico: z.string().min(1, "IČO je povinné"),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { ico } = querySchema.parse({ ico: searchParams.get("ico") });

    const result = await verifyIco(ico);

    if (!result) {
      return NextResponse.json(
        { error: "IČO nenalezeno v registru ARES" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatné IČO", details: error.issues },
        { status: 400 }
      );
    }

    console.error("ARES API error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se ověřit IČO" },
      { status: 500 }
    );
  }
}

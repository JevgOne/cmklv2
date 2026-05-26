import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { flagListingManually } from "@/lib/listing-flagging";
import { rateLimit } from "@/lib/rate-limit";

/* ------------------------------------------------------------------ */
/*  POST /api/listings/[id]/flag — Nahlásit inzerát (bez auth)         */
/* ------------------------------------------------------------------ */

const flagSchema = z.object({
  reason: z.string().min(1, "Důvod je povinný").max(500),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }

) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success } = rateLimit(`listing-flag:${ip}`, 3, 10 * 60 * 1000);
    if (!success) {
      return NextResponse.json({ error: "Příliš mnoho požadavků" }, { status: 429 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = flagSchema.parse(body);

    await flagListingManually(id, data.reason);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/listings/[id]/flag error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

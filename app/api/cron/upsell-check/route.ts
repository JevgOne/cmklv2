import { NextRequest, NextResponse } from "next/server";
import { checkUpsellCandidates } from "@/lib/listing-sla";

/* ------------------------------------------------------------------ */
/*  GET /api/cron/upsell-check — 14/30/45 dní upsell kandidáti        */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await checkUpsellCandidates();

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("CRON upsell-check error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

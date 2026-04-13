import { NextRequest, NextResponse } from "next/server";
import { checkInquirySla } from "@/lib/listing-sla";

/* ------------------------------------------------------------------ */
/*  GET /api/cron/sla-check — 48h reminder, 7d deaktivace              */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    // Ověřit cron secret (ochrana proti volání zvenčí)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await checkInquirySla();

    return NextResponse.json({
      success: true,
      reminders: result.reminders,
      deactivated: result.deactivated,
    });
  } catch (error) {
    console.error("CRON sla-check error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { matchWatchdogs } from "@/lib/listing-sla";

/* ------------------------------------------------------------------ */
/*  GET /api/cron/watchdog-match — Matching nových inzerátů s watchdogy */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const matched = await matchWatchdogs();

    return NextResponse.json({ success: true, matched });
  } catch (error) {
    console.error("CRON watchdog-match error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

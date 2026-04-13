import { NextRequest, NextResponse } from "next/server";
import { checkListingExpiry } from "@/lib/listing-sla";

/* ------------------------------------------------------------------ */
/*  GET /api/cron/listing-expiry — 60 dní expirace inzerátů            */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expired = await checkListingExpiry();

    return NextResponse.json({ success: true, expired });
  } catch (error) {
    console.error("CRON listing-expiry error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

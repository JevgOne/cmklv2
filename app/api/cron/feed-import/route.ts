import { NextRequest, NextResponse } from "next/server";
import { importDueFeeds } from "@/lib/feed-import";

/**
 * GET /api/cron/feed-import — Auto-import feedů podle frekvence
 *
 * Volá se z Vercel Cron nebo externího cron systému.
 * Ochrana: CRON_SECRET header.
 *
 * Query params:
 *   frequency=DAILY|WEEKLY (volitelné, default: importuje všechny aktivní)
 */
export async function GET(request: NextRequest) {
  try {
    // Ověření cron secret
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Neautorizováno" }, { status: 401 });
    }

    const frequency = request.nextUrl.searchParams.get("frequency") ?? undefined;

    const result = await importDueFeeds(frequency);

    return NextResponse.json({
      success: true,
      imported: result.imported,
      failed: result.failed,
      results: result.results,
    });
  } catch (error) {
    console.error("GET /api/cron/feed-import error:", error);
    return NextResponse.json({ error: "Import feedů selhal" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { checkStaleVehicles } from "@/lib/price-reduction-checker";

/* ------------------------------------------------------------------ */
/*  GET /api/cron/stale-vehicles — kontrola starych vozidel            */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await checkStaleVehicles();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      total: result.total,
    });
  } catch (error) {
    console.error("CRON stale-vehicles error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { checkStaleVehicles } from "@/lib/price-reduction-checker";

/* ------------------------------------------------------------------ */
/*  GET /api/cron/stale-vehicles — kontrola starych vozidel            */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

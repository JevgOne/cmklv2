import { NextRequest, NextResponse } from "next/server";
import { checkAndSendStockAlerts } from "@/lib/stock-alerts";

/* ------------------------------------------------------------------ */
/*  GET /api/cron/stock-alerts — denní kontrola nízkého skladu          */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await checkAndSendStockAlerts();

    return NextResponse.json({
      success: true,
      suppliersNotified: result.suppliersNotified,
      totalLowStockParts: result.totalLowStockParts,
      errors: result.errors,
    });
  } catch (error) {
    console.error("CRON stock-alerts error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 },
    );
  }
}

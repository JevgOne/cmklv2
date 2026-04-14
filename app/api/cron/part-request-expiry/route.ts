import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/cron/part-request-expiry — Expirace poptávek (14 dní)     */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expired = await prisma.partRequest.updateMany({
      where: {
        status: { in: ["OPEN", "OFFERS_RECEIVED"] },
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    return NextResponse.json({ success: true, expired: expired.count });
  } catch (error) {
    console.error("CRON part-request-expiry error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

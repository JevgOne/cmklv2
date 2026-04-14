import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/cron/reservation-part-expiry — 30min expirace dílů        */
/*  Separate from reservation-expiry (48h vehicle reservations).       */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await prisma.partReservation.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        orderId: null,
      },
    });

    return NextResponse.json({ success: true, expired: deleted.count });
  } catch (error) {
    console.error("CRON reservation-part-expiry error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

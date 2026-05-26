import { NextRequest, NextResponse } from "next/server";
import { getSessionOrMobileToken } from "@/lib/auth-mobile";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  PUT /api/marketplace/notifications/read-all — Mark all as read     */
/* ------------------------------------------------------------------ */

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionOrMobileToken(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        type: { startsWith: "MARKETPLACE_" },
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("PUT /api/marketplace/notifications/read-all error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

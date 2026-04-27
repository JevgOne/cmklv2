import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/marketplace/notifications — User's marketplace notifications */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const unreadOnly = params.get("unread") === "true";
    const limit = Math.min(50, Number(params.get("limit")) || 20);
    const cursor = params.get("cursor"); // pagination

    const where: Record<string, unknown> = {
      userId: session.user.id,
      type: { startsWith: "MARKETPLACE_" },
    };

    if (unreadOnly) {
      where.read = false;
    }

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          type: { startsWith: "MARKETPLACE_" },
          read: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === limit,
    });
  } catch (error) {
    console.error("GET /api/marketplace/notifications error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

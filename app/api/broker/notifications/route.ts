import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN", "PARTS_SUPPLIER"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Neprihlaseny" },
        { status: 401 }
      );
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Pristup odepren" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const take = Math.min(Number(searchParams.get("take")) || 5, 50);
    const cursor = searchParams.get("cursor") || undefined;
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where = {
      userId,
      ...(unreadOnly && { read: false }),
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: take + 1, // +1 pro detekci dalších stránek
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    const hasMore = notifications.length > take;
    const items = hasMore ? notifications.slice(0, take) : notifications;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return NextResponse.json({
      notifications: items,
      unreadCount,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("GET /api/broker/notifications error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
  markAllRead: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Neprihlaseny" },
        { status: 401 }
      );
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Pristup odepren" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = markReadSchema.parse(body);

    if (data.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      });
    } else if (data.ids && data.ids.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: data.ids },
          userId: session.user.id,
        },
        data: { read: true },
      });
    } else {
      return NextResponse.json(
        { error: "Zadejte ids nebo markAllRead" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatna data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PATCH /api/broker/notifications error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

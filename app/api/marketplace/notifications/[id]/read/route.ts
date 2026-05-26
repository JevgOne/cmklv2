import { NextRequest, NextResponse } from "next/server";
import { getSessionOrMobileToken } from "@/lib/auth-mobile";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  PUT /api/marketplace/notifications/[id]/read — Mark single as read */
/* ------------------------------------------------------------------ */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrMobileToken(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Notifikace nenalezena" },
        { status: 404 }
      );
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/marketplace/notifications/[id]/read error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

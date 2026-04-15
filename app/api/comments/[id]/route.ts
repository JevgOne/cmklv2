import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* DELETE /api/comments/[id] — Smazat komentář */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;
    const comment = await prisma.profileComment.findUnique({
      where: { id },
      select: {
        userId: true,
        vehicleId: true,
        listingId: true,
        partId: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Komentář nenalezen" }, { status: 404 });
    }

    // Owner komentáře, admin, nebo owner položky
    const isOwner = comment.userId === session.user.id;
    const isAdmin = ["ADMIN", "BACKOFFICE"].includes(session.user.role);

    let isItemOwner = false;
    if (!isOwner && !isAdmin) {
      if (comment.vehicleId) {
        const v = await prisma.vehicle.findUnique({
          where: { id: comment.vehicleId },
          select: { brokerId: true },
        });
        isItemOwner = v?.brokerId === session.user.id;
      } else if (comment.listingId) {
        const l = await prisma.listing.findUnique({
          where: { id: comment.listingId },
          select: { userId: true },
        });
        isItemOwner = l?.userId === session.user.id;
      } else if (comment.partId) {
        const p = await prisma.part.findUnique({
          where: { id: comment.partId },
          select: { supplierId: true },
        });
        isItemOwner = p?.supplierId === session.user.id;
      }
    }

    if (!isOwner && !isAdmin && !isItemOwner) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    await prisma.profileComment.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/comments/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

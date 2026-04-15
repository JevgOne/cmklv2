import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkAndAwardBadges } from "@/lib/badges";

const likeSchema = z.object({
  vehicleId: z.string().optional(),
  listingId: z.string().optional(),
  partId: z.string().optional(),
}).refine(
  (data) => {
    const targets = [data.vehicleId, data.listingId, data.partId].filter(Boolean);
    return targets.length === 1;
  },
  { message: "Právě jeden z vehicleId/listingId/partId musí být vyplněn" },
);

/* POST /api/likes — Toggle like */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const body = await request.json();
    const data = likeSchema.parse(body);
    const userId = session.user.id;

    // Find existing like
    let existing = null;
    if (data.vehicleId) {
      existing = await prisma.profileLike.findUnique({
        where: { userId_vehicleId: { userId, vehicleId: data.vehicleId } },
      });
    } else if (data.listingId) {
      existing = await prisma.profileLike.findUnique({
        where: { userId_listingId: { userId, listingId: data.listingId } },
      });
    } else if (data.partId) {
      existing = await prisma.profileLike.findUnique({
        where: { userId_partId: { userId, partId: data.partId } },
      });
    }

    if (existing) {
      // Unlike
      await prisma.profileLike.delete({ where: { id: existing.id } });
      const totalLikes = await countLikesForTarget(data);
      return NextResponse.json({ liked: false, totalLikes });
    }

    // Like
    await prisma.profileLike.create({
      data: {
        userId,
        vehicleId: data.vehicleId ?? null,
        listingId: data.listingId ?? null,
        partId: data.partId ?? null,
      },
    });

    const totalLikes = await countLikesForTarget(data);

    // Best-effort badge check for item owner
    try {
      const ownerId = await getItemOwnerId(data);
      if (ownerId) await checkAndAwardBadges(ownerId);
    } catch { /* non-critical */ }

    return NextResponse.json({ liked: true, totalLikes }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/likes error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

async function countLikesForTarget(data: { vehicleId?: string; listingId?: string; partId?: string }): Promise<number> {
  if (data.vehicleId) return prisma.profileLike.count({ where: { vehicleId: data.vehicleId } });
  if (data.listingId) return prisma.profileLike.count({ where: { listingId: data.listingId } });
  if (data.partId) return prisma.profileLike.count({ where: { partId: data.partId } });
  return 0;
}

async function getItemOwnerId(data: { vehicleId?: string; listingId?: string; partId?: string }): Promise<string | null> {
  if (data.vehicleId) {
    const v = await prisma.vehicle.findUnique({ where: { id: data.vehicleId }, select: { brokerId: true } });
    return v?.brokerId ?? null;
  }
  if (data.listingId) {
    const l = await prisma.listing.findUnique({ where: { id: data.listingId }, select: { userId: true } });
    return l?.userId ?? null;
  }
  if (data.partId) {
    const p = await prisma.part.findUnique({ where: { id: data.partId }, select: { supplierId: true } });
    return p?.supplierId ?? null;
  }
  return null;
}

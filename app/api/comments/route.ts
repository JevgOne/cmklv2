import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkAndAwardBadges } from "@/lib/badges";

const createCommentSchema = z.object({
  vehicleId: z.string().optional(),
  listingId: z.string().optional(),
  partId: z.string().optional(),
  text: z.string().min(1, "Komentář nesmí být prázdný").max(500, "Max 500 znaků"),
}).refine(
  (data) => {
    const targets = [data.vehicleId, data.listingId, data.partId].filter(Boolean);
    return targets.length === 1;
  },
  { message: "Právě jeden z vehicleId/listingId/partId musí být vyplněn" },
);

/* POST /api/comments — Přidat komentář */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const body = await request.json();
    const data = createCommentSchema.parse(body);

    // Rate limit: max 10 comments per 5 min
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentCount = await prisma.profileComment.count({
      where: { userId: session.user.id, createdAt: { gte: fiveMinAgo } },
    });
    if (recentCount >= 10) {
      return NextResponse.json(
        { error: "Příliš mnoho komentářů. Zkuste to za chvíli." },
        { status: 429 },
      );
    }

    const comment = await prisma.profileComment.create({
      data: {
        userId: session.user.id,
        vehicleId: data.vehicleId ?? null,
        listingId: data.listingId ?? null,
        partId: data.partId ?? null,
        text: data.text,
      },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true, slug: true } },
      },
    });

    // Best-effort badge check
    try {
      await checkAndAwardBadges(session.user.id);
    } catch { /* non-critical */ }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/comments error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

/* GET /api/comments?vehicleId=xxx (or listingId/partId) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const vehicleId = searchParams.get("vehicleId");
    const listingId = searchParams.get("listingId");
    const partId = searchParams.get("partId");
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20", 10));

    if (!vehicleId && !listingId && !partId) {
      return NextResponse.json({ error: "vehicleId, listingId nebo partId je povinné" }, { status: 400 });
    }

    const where: Record<string, unknown> = { isHidden: false };
    if (vehicleId) where.vehicleId = vehicleId;
    if (listingId) where.listingId = listingId;
    if (partId) where.partId = partId;

    const comments = await prisma.profileComment.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const total = await prisma.profileComment.count({ where });
    const nextCursor = comments.length === limit ? comments[comments.length - 1].id : null;

    return NextResponse.json({ comments, total, nextCursor });
  } catch (error) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

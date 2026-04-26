import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { z } from "zod";

const reactionSchema = z.object({
  type: z.enum(["LIKE", "HEART", "CLAP", "FIRE", "THINKING"]),
});

async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sid = cookieStore.get("cm_session")?.value;
  if (!sid) {
    sid = crypto.randomUUID();
  }
  return sid;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const counts = await prisma.articleReaction.groupBy({
      by: ["type"],
      where: { articleId: id },
      _count: true,
    });

    const countsMap: Record<string, number> = {};
    for (const c of counts) {
      countsMap[c.type] = c._count;
    }

    let userReactions: string[] = [];
    if (session?.user?.id) {
      const mine = await prisma.articleReaction.findMany({
        where: { articleId: id, userId: session.user.id },
        select: { type: true },
      });
      userReactions = mine.map((r) => r.type);
    } else {
      const sid = await getSessionId();
      const mine = await prisma.articleReaction.findMany({
        where: { articleId: id, sessionId: sid },
        select: { type: true },
      });
      userReactions = mine.map((r) => r.type);
    }

    return NextResponse.json({ counts: countsMap, userReactions });
  } catch (error) {
    console.error("GET reactions error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type } = reactionSchema.parse(body);

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    const sessionId = userId ? null : await getSessionId();

    // Toggle: existuje → smaž, neexistuje → vytvoř
    const existing = await prisma.articleReaction.findFirst({
      where: {
        articleId: id,
        type,
        ...(userId ? { userId } : { sessionId }),
      },
    });

    if (existing) {
      await prisma.articleReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.articleReaction.create({
        data: {
          articleId: id,
          type,
          userId,
          sessionId,
        },
      });
    }

    // Vrátit aktualizované počty
    const counts = await prisma.articleReaction.groupBy({
      by: ["type"],
      where: { articleId: id },
      _count: true,
    });

    const countsMap: Record<string, number> = {};
    for (const c of counts) {
      countsMap[c.type] = c._count;
    }

    const response = NextResponse.json({
      counts: countsMap,
      toggled: !existing,
    });

    // Nastavit session cookie pro anonymní
    if (!userId && sessionId) {
      response.cookies.set("cm_session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 rok
        path: "/",
      });
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatný typ reakce" }, { status: 400 });
    }
    console.error("POST reactions error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
  text: z.string().min(5, "Komentář musí mít alespoň 5 znaků").max(1000, "Komentář může mít max 1000 znaků"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = 10;

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && ["ADMIN", "BACKOFFICE"].includes(session.user.role);

    // Admin vidí i skryté komentáře
    const where = {
      articleId: id,
      ...(!isAdmin && { isHidden: false }),
    };

    const [comments, total] = await Promise.all([
      prisma.profileComment.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.profileComment.count({ where }),
    ]);

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        text: c.text,
        isHidden: c.isHidden,
        createdAt: c.createdAt.toISOString(),
        author: c.user,
      })),
      total,
      totalPages: Math.ceil(total / perPage),
      page,
    });
  } catch (error) {
    console.error("GET comments error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Pro komentování se přihlaste" }, { status: 401 });
    }

    const body = await request.json();
    const { text } = commentSchema.parse(body);

    // Rate limit: max 3 komentáře za minutu
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recentCount = await prisma.profileComment.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: oneMinuteAgo },
      },
    });
    if (recentCount >= 3) {
      return NextResponse.json({ error: "Příliš mnoho komentářů. Zkuste to za chvíli." }, { status: 429 });
    }

    // MODERACE-FIRST: isHidden=true — komentář čeká na schválení
    const comment = await prisma.profileComment.create({
      data: {
        articleId: id,
        userId: session.user.id,
        text,
        isHidden: true,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        text: comment.text,
        isHidden: comment.isHidden,
        createdAt: comment.createdAt.toISOString(),
        author: comment.user,
      },
      message: "Komentář odeslán. Zobrazí se po schválení administrátorem.",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST comment error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

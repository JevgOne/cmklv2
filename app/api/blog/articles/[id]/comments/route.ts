import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
  text: z.string().min(5, "Komentář musí mít alespoň 5 znaků").max(1000, "Komentář může mít max 1000 znaků"),
  authorName: z.string().min(2, "Jméno musí mít alespoň 2 znaky").max(100).optional(),
  authorEmail: z.string().email("Neplatný email").max(200).optional(),
  // Honeypot field — must be empty
  website: z.string().optional(),
});

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

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
        author: c.user
          ? {
              id: c.user.id,
              firstName: c.user.firstName,
              lastName: c.user.lastName,
              avatar: c.user.avatar,
            }
          : null,
        authorName: c.authorName,
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
    const body = await request.json();
    const parsed = commentSchema.parse(body);

    // Honeypot check — bots fill the hidden "website" field
    if (parsed.website) {
      return NextResponse.json({
        comment: { id: "fake", text: parsed.text, isHidden: true, createdAt: new Date().toISOString(), author: null, authorName: parsed.authorName },
        message: "Komentář odeslán. Zobrazí se po schválení administrátorem.",
      }, { status: 201 });
    }

    const clientIp = getClientIp(request);

    if (session?.user) {
      // Authenticated user — rate limit: 3/minute per user
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

      const comment = await prisma.profileComment.create({
        data: {
          articleId: id,
          userId: session.user.id,
          text: parsed.text,
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
          authorName: null,
        },
        message: "Komentář odeslán. Zobrazí se po schválení administrátorem.",
      }, { status: 201 });
    }

    // Guest comment — require name + email
    if (!parsed.authorName || !parsed.authorEmail) {
      return NextResponse.json({ error: "Jméno a email jsou povinné." }, { status: 400 });
    }

    // IP rate limit for guests: max 5 comments per hour
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const guestRecentCount = await prisma.profileComment.count({
      where: {
        guestIp: clientIp,
        userId: null,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (guestRecentCount >= 5) {
      return NextResponse.json({ error: "Příliš mnoho komentářů. Zkuste to za hodinu." }, { status: 429 });
    }

    const comment = await prisma.profileComment.create({
      data: {
        articleId: id,
        authorName: parsed.authorName,
        authorEmail: parsed.authorEmail,
        guestIp: clientIp,
        text: parsed.text,
        isHidden: true,
      },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        text: comment.text,
        isHidden: comment.isHidden,
        createdAt: comment.createdAt.toISOString(),
        author: null,
        authorName: comment.authorName,
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

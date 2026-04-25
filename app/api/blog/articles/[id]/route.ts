import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  slug: z.string().min(3).max(200).optional(),
  content: z.string().min(10).optional(),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().nullable().optional(),
  categoryId: z.string().min(1).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  readTime: z.number().int().positive().optional(),
  status: z.enum(["DRAFT", "REVIEW", "ARCHIVED"]).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, bio: true, slug: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Článek nenalezen" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("GET /api/blog/articles/[id] error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;
    const article = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Článek nenalezen" }, { status: 404 });
    }

    const role = session.user.role;
    if (article.authorId !== session.user.id && !["ADMIN", "BACKOFFICE"].includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    const updated = await prisma.article.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("PATCH /api/blog/articles/[id] error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const role = session.user.role;
    if (!["ADMIN", "BACKOFFICE"].includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.article.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/blog/articles/[id] error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

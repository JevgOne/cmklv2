import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200),
  content: z.string().min(10),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().optional(),
  categoryId: z.string().min(1),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  readTime: z.number().int().positive().optional(),
  tagIds: z.array(z.string()).max(5).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PUBLISHED";
    const categorySlug = searchParams.get("category");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status };

    if (categorySlug) {
      const category = await prisma.articleCategory.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          author: { select: { id: true, firstName: true, lastName: true, avatar: true, slug: true } },
        },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/blog/articles error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const role = session.user.role;
    if (!["ADMIN", "BACKOFFICE", "BROKER"].includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const data = createSchema.parse(body);

    const existing = await prisma.article.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "Článek s tímto slugem již existuje" }, { status: 409 });
    }

    const { tagIds, ...articleData } = data;

    const article = await prisma.article.create({
      data: {
        ...articleData,
        authorId: session.user.id,
        status: "DRAFT",
        ...(tagIds?.length ? {
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        } : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Neplatná data", details: error.issues }, { status: 400 });
    }
    console.error("POST /api/blog/articles error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

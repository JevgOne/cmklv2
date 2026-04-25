import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.articleCategory.findMany({
      include: {
        _count: { select: { articles: { where: { status: "PUBLISHED" } } } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        articleCount: c._count.articles,
      }))
    );
  } catch (error) {
    console.error("GET /api/blog/categories error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

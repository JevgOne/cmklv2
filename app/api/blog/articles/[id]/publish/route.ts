import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Pouze admin může publikovat články" }, { status: 403 });
    }

    const { id } = await params;
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Článek nenalezen" }, { status: 404 });
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/blog/articles/[id]/publish error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

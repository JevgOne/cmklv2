import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE"];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const review = await prisma.servisReview.update({
      where: { id },
      data: body,
    });

    // Update aggregated rating on servis
    const stats = await prisma.servisReview.aggregate({
      where: { servisId: review.servisId, isPublished: true },
      _avg: { rating: true },
      _count: true,
    });

    const publishedReviews = await prisma.servisReview.findMany({
      where: { servisId: review.servisId, isPublished: true },
      select: { recommend: true },
    });

    const recommendCount = publishedReviews.filter((r) => r.recommend).length;

    await prisma.autoServis.update({
      where: { id: review.servisId },
      data: {
        averageRating: Math.round((stats._avg.rating || 0) * 10) / 10,
        reviewCount: stats._count,
        recommendRate: publishedReviews.length > 0
          ? Math.round((recommendCount / publishedReviews.length) * 100)
          : 0,
      },
    });

    return NextResponse.json(review);
  } catch {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.servisReview.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }
}

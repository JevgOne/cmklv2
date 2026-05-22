import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateBrokerRatings } from "@/lib/broker-reviews";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reviews = await prisma.brokerReview.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      broker: { select: { firstName: true, lastName: true, slug: true } },
    },
  });

  return NextResponse.json(reviews);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "BACKOFFICE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, isPublished, isFeatured } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const review = await prisma.brokerReview.findUnique({
    where: { id },
    select: { brokerId: true },
  });
  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.brokerReview.update({
    where: { id },
    data: {
      ...(typeof isPublished === "boolean" && { isPublished }),
      ...(typeof isFeatured === "boolean" && { isFeatured }),
    },
  });

  // STOP-7: Recalculate aggregate ratings only on publish/unpublish
  if (typeof isPublished === "boolean") {
    await recalculateBrokerRatings(review.brokerId);
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const review = await prisma.brokerReview.findUnique({
    where: { id },
    select: { brokerId: true },
  });
  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.brokerReview.delete({ where: { id } });
  await recalculateBrokerRatings(review.brokerId);

  return NextResponse.json({ ok: true });
}

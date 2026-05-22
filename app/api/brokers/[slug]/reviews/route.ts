import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const brokerReviewSchema = z.object({
  authorName: z.string().min(2).max(100),
  authorCity: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(20).max(5000),
  recommend: z.boolean().default(true),
  transactionType: z.enum(["SALE", "PURCHASE", "CONSULTATION"]).optional(),
  vehicleBrand: z.string().max(50).optional(),
  vehicleModel: z.string().max(50).optional(),
  ratingCommunication: z.number().int().min(1).max(5).optional(),
  ratingSpeed: z.number().int().min(1).max(5).optional(),
  ratingFairness: z.number().int().min(1).max(5).optional(),
  ratingProfessionalism: z.number().int().min(1).max(5).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const user = await prisma.user.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Makléř nenalezen" }, { status: 404 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

  const [reviews, total] = await Promise.all([
    prisma.brokerReview.findMany({
      where: { brokerId: user.id, isPublished: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.brokerReview.count({
      where: { brokerId: user.id, isPublished: true },
    }),
  ]);

  return NextResponse.json({
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // STOP-4: Rate limit 3 req / 10 min per IP
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip, 3, 10 * 60 * 1000);
  if (!success) {
    return NextResponse.json(
      { error: "Příliš mnoho požadavků. Zkuste to za 10 minut." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Makléř nenalezen" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = brokerReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Neplatná data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);

  const review = await prisma.brokerReview.create({
    data: {
      ...parsed.data,
      brokerId: user.id,
      authorUserId: session?.user?.id || null,
      isPublished: false, // STOP-2: always needs admin approval
    },
  });

  return NextResponse.json(review, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const reviewSchema = z.object({
  authorName: z.string().min(2).max(100),
  authorCity: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5),
  recommend: z.boolean().default(true),
  title: z.string().max(200).optional(),
  text: z.string().min(20).max(5000),
  ratingQuality: z.number().int().min(1).max(5).optional(),
  ratingPrice: z.number().int().min(1).max(5).optional(),
  ratingSpeed: z.number().int().min(1).max(5).optional(),
  ratingComm: z.number().int().min(1).max(5).optional(),
  serviceType: z.string().max(100).optional(),
  vehicleBrand: z.string().max(100).optional(),
  ratingWaitTime: z.number().int().min(1).max(5).optional(),
  ratingFairness: z.number().int().min(1).max(5).optional(),
  passedInspection: z.boolean().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

  const [reviews, total] = await Promise.all([
    prisma.servisReview.findMany({
      where: { servisId: id, isPublished: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 10,
      take: 10,
    }),
    prisma.servisReview.count({ where: { servisId: id, isPublished: true } }),
  ]);

  return NextResponse.json({ reviews, total, page, totalPages: Math.ceil(total / 10) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { success } = rateLimit(`servis-review:${ip}`, 3, 10 * 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: "Příliš mnoho požadavků" }, { status: 429 });
  }

  const { id } = await params;

  const servis = await prisma.autoServis.findUnique({ where: { id } });
  if (!servis) {
    return NextResponse.json({ error: "Servis nenalezen" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatná data", details: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  const review = await prisma.servisReview.create({
    data: {
      ...parsed.data,
      servisId: id,
      authorUserId: session?.user?.id || null,
      isPublished: false, // STOP-3: always needs admin approval
    },
  });

  return NextResponse.json(review, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE"];

const reviewSchema = z.object({
  authorName: z.string().min(2).max(100),
  authorCity: z.string().max(100).nullable().optional(),
  text: z.string().min(10).max(2000),
  rating: z.number().int().min(1).max(5).default(5),
  type: z.enum(["GENERAL", "SELLER", "BUYER"]).default("GENERAL"),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  source: z.string().max(50).nullable().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validační chyba", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const review = await prisma.review.create({
    data: parsed.data,
  });

  return NextResponse.json(review, { status: 201 });
}

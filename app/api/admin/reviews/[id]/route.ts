import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE"];

const reviewUpdateSchema = z.object({
  authorName: z.string().min(2).max(100).optional(),
  authorCity: z.string().max(100).nullable().optional(),
  text: z.string().min(10).max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  type: z.enum(["GENERAL", "SELLER", "BUYER"]).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  source: z.string().max(50).nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = reviewUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validační chyba", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const review = await prisma.review.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(review);
  } catch {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }
}

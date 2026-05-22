import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_ROLES = ["ADMIN", "BACKOFFICE"];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const filter = searchParams.get("filter") || "all";

  const where: Record<string, unknown> = {};
  if (filter === "pending") where.isPublished = false;
  if (filter === "verified") where.isVerified = true;
  if (filter === "featured") where.isFeatured = true;

  const servisy = await prisma.autoServis.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { reviews: true } },
    },
  });

  return NextResponse.json(servisy);
}

const updateSchema = z.object({
  id: z.string().min(1),
  isVerified: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isClaimed: z.boolean().optional(),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { id, ...data } = parsed.data;

  try {
    const servis = await prisma.autoServis.update({
      where: { id },
      data,
    });
    return NextResponse.json(servis);
  } catch {
    return NextResponse.json({ error: "Nenalezeno" }, { status: 404 });
  }
}

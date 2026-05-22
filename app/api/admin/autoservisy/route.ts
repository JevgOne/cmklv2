import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "ID je povinné" }, { status: 400 });
  }

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

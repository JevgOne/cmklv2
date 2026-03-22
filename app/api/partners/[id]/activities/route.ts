import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createActivitySchema } from "@/lib/validators/partner";

const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;

    const activities = await prisma.partnerActivity.findMany({
      where: { partnerId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("GET /api/partners/[id]/activities error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = createActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner) {
      return NextResponse.json({ error: "Partner nenalezen" }, { status: 404 });
    }

    const activity = await prisma.partnerActivity.create({
      data: {
        partnerId: id,
        userId: session.user.id,
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description || null,
        nextContactDate: parsed.data.nextContactDate
          ? new Date(parsed.data.nextContactDate)
          : null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("POST /api/partners/[id]/activities error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

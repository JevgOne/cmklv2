import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoutLeadActivitySchema } from "@/lib/validators/scout-lead";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;

    const activities = await prisma.scoutLeadActivity.findMany({
      where: { scoutLeadId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("GET /api/scout-leads/[id]/activities error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const role = session.user.role;
    const ALLOWED = [
      "ADMIN",
      "BACKOFFICE",
      "MANAGER",
      "REGIONAL_DIRECTOR",
      "BROKER",
    ];
    if (!ALLOWED.includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = scoutLeadActivitySchema.parse(body);

    const lead = await prisma.scoutLead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    // Broker can only add activities to their own leads
    if (role === "BROKER" && lead.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const activity = await prisma.scoutLeadActivity.create({
      data: {
        scoutLeadId: id,
        userId: session.user.id,
        type: data.type,
        title: data.title,
        description: data.description ?? null,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/scout-leads/[id]/activities error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

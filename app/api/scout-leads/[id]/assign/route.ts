import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoutLeadAssignSchema } from "@/lib/validators/scout-lead";
import { z } from "zod";

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
    const ALLOWED = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];
    if (!ALLOWED.includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = scoutLeadAssignSchema.parse(body);

    const lead = await prisma.scoutLead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: data.assignedToId },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Uživatel nenalezen" },
        { status: 404 }
      );
    }

    const updated = await prisma.scoutLead.update({
      where: { id },
      data: {
        assignedToId: data.assignedToId,
        assignedAt: new Date(),
      },
    });

    await prisma.scoutLeadActivity.create({
      data: {
        scoutLeadId: id,
        userId: session.user.id,
        type: "SYSTEM",
        title: `Přiřazeno: ${targetUser.firstName} ${targetUser.lastName}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/scout-leads/[id]/assign error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

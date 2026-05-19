import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoutLeadUpdateSchema } from "@/lib/validators/scout-lead";
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
    const role = session.user.role;
    const ALLOWED = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"];
    if (!ALLOWED.includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const lead = await prisma.scoutLead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, role: true, email: true },
        },
        linkedRegion: { select: { id: true, name: true } },
        activities: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    // RBAC check for broker
    if (role === "BROKER" && lead.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("GET /api/scout-leads/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const data = scoutLeadUpdateSchema.parse(body);

    const existing = await prisma.scoutLead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    // Log status change
    if (data.status && data.status !== existing.status) {
      await prisma.scoutLeadActivity.create({
        data: {
          scoutLeadId: id,
          userId: session.user.id,
          type: "ZMENA_STAVU",
          title: `Změna stavu: ${existing.status} → ${data.status}`,
          oldStatus: existing.status,
          newStatus: data.status,
        },
      });
    }

    const updated = await prisma.scoutLead.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.assignedToId !== undefined && {
          assignedToId: data.assignedToId,
          assignedAt: data.assignedToId ? new Date() : null,
        }),
        ...(data.rejectionReason !== undefined && {
          rejectionReason: data.rejectionReason,
        }),
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
    console.error("PATCH /api/scout-leads/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

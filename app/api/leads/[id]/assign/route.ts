import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignLeadSchema } from "@/lib/validators/lead";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const role = session.user.role;
    if (!["ADMIN", "BACKOFFICE", "REGIONAL_DIRECTOR", "MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead nenalezen" }, { status: 404 });
    }

    const body = await request.json();
    const data = assignLeadSchema.parse(body);

    // Verify broker exists and is active
    const broker = await prisma.user.findUnique({
      where: { id: data.assignedToId },
      select: { id: true, role: true, status: true },
    });

    if (!broker || broker.role !== "BROKER" || broker.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Makléř nenalezen nebo není aktivní" },
        { status: 400 }
      );
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        assignedToId: data.assignedToId,
        assignedById: session.user.id,
        assignedAt: new Date(),
        status: lead.status === "NEW" ? "ASSIGNED" : lead.status,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Create notification for assigned broker
    await prisma.notification.create({
      data: {
        userId: data.assignedToId,
        type: "SYSTEM",
        title: "Nový lead přiřazen",
        body: `Byl vám přiřazen nový lead: ${lead.name} (${lead.phone})${lead.brand ? ` — ${lead.brand} ${lead.model || ""}` : ""}`,
        link: `/makler/leads/${lead.id}`,
      },
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("PUT /api/leads/[id]/assign error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

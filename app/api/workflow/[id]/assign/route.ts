import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignWorkflowRequestSchema } from "@/lib/validators/workflow";
import { addWorkflowStep } from "@/lib/workflow/actions";
import { createNotification } from "@/lib/notifications";

const ASSIGN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }
    if (!ASSIGN_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění přiřazovat" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = assignWorkflowRequestSchema.parse(body);

    const existing = await prisma.workflowRequest.findUnique({
      where: { id },
      select: { id: true, assignedToId: true, status: true, title: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Požadavek nenalezen" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      assignedToId: data.assignedToId,
    };
    if (existing.status === "CREATED") {
      updateData.status = "ASSIGNED";
    }

    const updated = await prisma.workflowRequest.update({
      where: { id },
      data: updateData,
    });

    await addWorkflowStep(id, session.user.id, "ASSIGNED", {
      fromAssignee: existing.assignedToId ?? undefined,
      toAssignee: data.assignedToId,
    });

    // Notifikace
    await createNotification({
      userId: data.assignedToId,
      type: "SYSTEM",
      title: `Přiřazen požadavek: ${existing.title}`,
      body: `${session.user.firstName} ${session.user.lastName} vám přiřadil požadavek.`,
      link: `/makler/workflow/${id}`,
    });

    // Auto-watch
    await prisma.workflowWatcher.upsert({
      where: { requestId_userId: { requestId: id, userId: data.assignedToId } },
      update: {},
      create: { requestId: id, userId: data.assignedToId },
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("POST /api/workflow/[id]/assign error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

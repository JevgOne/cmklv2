import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionOrMobileToken } from "@/lib/auth-mobile";
import { prisma } from "@/lib/prisma";
import { updateWorkflowRequestSchema } from "@/lib/validators/workflow";
import { canTransition } from "@/lib/workflow/state-machine";
import { addWorkflowStep, notifyWatchers } from "@/lib/workflow/actions";
import { createNotification } from "@/lib/notifications";

const ALLOWED_ROLES = ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionOrMobileToken(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { id } = await params;

    const workflowRequest = await prisma.workflowRequest.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } },
        vehicle: { select: { id: true, brand: true, model: true, year: true, vin: true, status: true } },
        steps: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          where: { parentId: null }, // only top-level
          include: {
            user: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } },
            replies: {
              orderBy: { createdAt: "asc" },
              include: {
                user: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } },
              },
            },
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          include: {
            uploadedBy: { select: { firstName: true, lastName: true } },
          },
        },
        watchers: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!workflowRequest) {
      return NextResponse.json({ error: "Požadavek nenalezen" }, { status: 404 });
    }

    // Access check: admin/backoffice see all, others only their own/assigned/watched
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = workflowRequest.createdById === session.user.id;
    const isAssignee = workflowRequest.assignedToId === session.user.id;
    const isWatcher = workflowRequest.watchers.some((w) => w.userId === session.user.id);

    if (!isAdmin && !isCreator && !isAssignee && !isWatcher) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    return NextResponse.json({ request: workflowRequest });
  } catch (error) {
    console.error("GET /api/workflow/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionOrMobileToken(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateWorkflowRequestSchema.parse(body);

    const existing = await prisma.workflowRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        priority: true,
        assignedToId: true,
        createdById: true,
        title: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Požadavek nenalezen" }, { status: 404 });
    }

    const isCreator = existing.createdById === session.user.id;
    const updateData: Record<string, unknown> = {};

    // Status change
    if (data.status && data.status !== existing.status) {
      if (!canTransition(existing.status, data.status, session.user.role, isCreator)) {
        return NextResponse.json(
          { error: `Nelze změnit stav z "${existing.status}" na "${data.status}"` },
          { status: 400 },
        );
      }
      updateData.status = data.status;

      if (data.status === "RESOLVED") {
        updateData.resolvedAt = new Date();
        updateData.resolvedById = session.user.id;
        if (data.resolution) updateData.resolution = data.resolution;
      }

      if (data.status === "ESCALATED") {
        // Unassign so an ADMIN can pick it up
        updateData.assignedToId = null;

        await addWorkflowStep(id, session.user.id, "ESCALATED", {
          fromStatus: existing.status,
          toStatus: "ESCALATED",
          note: data.escalationReason || "Eskalováno bez důvodu",
        });

        // Notify all ADMINs about the escalation
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", status: "ACTIVE" },
          select: { id: true },
        });

        const escalator = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { firstName: true, lastName: true },
        });
        const escalatorName = escalator
          ? `${escalator.firstName} ${escalator.lastName}`
          : "Neznámý";

        await Promise.all(
          admins.map((admin) =>
            createNotification({
              userId: admin.id,
              type: "SYSTEM",
              title: `Eskalace: ${existing.title}`,
              body: `${escalatorName} eskaloval požadavek. Důvod: ${data.escalationReason || "—"}`,
              link: `/admin/workflow/${id}`,
            }),
          ),
        );
      } else {
        await addWorkflowStep(id, session.user.id, "STATUS_CHANGED", {
          fromStatus: existing.status,
          toStatus: data.status,
        });
      }

      await notifyWatchers(
        id,
        session.user.id,
        `Požadavek aktualizován: ${existing.title}`,
        `Stav změněn: ${existing.status} → ${data.status}`,
      );
    }

    // Priority change
    if (data.priority && data.priority !== existing.priority) {
      updateData.priority = data.priority;

      await addWorkflowStep(id, session.user.id, "PRIORITY_CHANGED", {
        note: `${existing.priority} → ${data.priority}`,
      });
    }

    // Assignment change
    if (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) {
      updateData.assignedToId = data.assignedToId;
      if (!updateData.status && existing.status === "CREATED") {
        updateData.status = "ASSIGNED";
      }

      await addWorkflowStep(id, session.user.id, "REASSIGNED", {
        fromAssignee: existing.assignedToId ?? undefined,
        toAssignee: data.assignedToId ?? undefined,
      });

      // Notifikace novému assignee
      if (data.assignedToId) {
        await createNotification({
          userId: data.assignedToId,
          type: "SYSTEM",
          title: `Přiřazen požadavek: ${existing.title}`,
          body: `Byl vám přiřazen požadavek.`,
          link: `/makler/pozadavky/${id}`,
        });

        // Auto-watch assignee
        await prisma.workflowWatcher.upsert({
          where: { requestId_userId: { requestId: id, userId: data.assignedToId } },
          update: {},
          create: { requestId: id, userId: data.assignedToId },
        });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Žádné změny" }, { status: 400 });
    }

    const updated = await prisma.workflowRequest.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 },
      );
    }
    console.error("PATCH /api/workflow/[id] error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

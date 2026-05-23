import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { autoAssignRequest } from "./router";
import { calculateDueDate } from "./sla";
import type { CreateWorkflowRequest } from "@/lib/validators/workflow";

export async function createWorkflowRequest(
  data: CreateWorkflowRequest,
  createdById: string,
) {
  // Auto-routing
  const assignment = await autoAssignRequest(data.type, createdById);
  const dueAt = calculateDueDate(data.type, data.priority ?? "NORMAL");

  const request = await prisma.workflowRequest.create({
    data: {
      type: data.type,
      category: data.category ?? null,
      title: data.title,
      description: data.description,
      priority: data.priority ?? "NORMAL",
      status: assignment.assignedToId ? "ASSIGNED" : "CREATED",
      createdById,
      assignedToId: assignment.assignedToId ?? null,
      assignedRole: assignment.assignedRole,
      vehicleId: data.vehicleId ?? null,
      contactId: data.contactId ?? null,
      contractId: data.contractId ?? null,
      leadId: data.leadId ?? null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      dueAt,
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });

  // Audit trail: CREATED step
  await prisma.workflowStep.create({
    data: {
      requestId: request.id,
      userId: createdById,
      action: "CREATED",
      toStatus: request.status,
    },
  });

  // Pokud auto-assigned, přidej ASSIGNED step
  if (assignment.assignedToId) {
    await prisma.workflowStep.create({
      data: {
        requestId: request.id,
        userId: createdById,
        action: "ASSIGNED",
        toAssignee: assignment.assignedToId,
        note: `Automaticky přiřazeno (${assignment.assignedRole})`,
      },
    });

    // Notifikace assignee
    await createNotification({
      userId: assignment.assignedToId,
      type: "SYSTEM",
      title: `Nový požadavek: ${data.title}`,
      body: `${request.createdBy.firstName} ${request.createdBy.lastName} vytvořil požadavek typu ${data.type}.`,
      link: `/makler/workflow/${request.id}`,
    });
  }

  // Auto-watch: creator
  await prisma.workflowWatcher.create({
    data: { requestId: request.id, userId: createdById },
  });

  return request;
}

export async function addWorkflowStep(
  requestId: string,
  userId: string,
  action: string,
  details: {
    fromStatus?: string;
    toStatus?: string;
    fromAssignee?: string;
    toAssignee?: string;
    note?: string;
  } = {},
) {
  return prisma.workflowStep.create({
    data: {
      requestId,
      userId,
      action,
      ...details,
    },
  });
}

export async function notifyWatchers(
  requestId: string,
  excludeUserId: string,
  title: string,
  body: string,
) {
  const watchers = await prisma.workflowWatcher.findMany({
    where: { requestId, userId: { not: excludeUserId } },
    select: { userId: true },
  });

  await Promise.all(
    watchers.map((w) =>
      createNotification({
        userId: w.userId,
        type: "SYSTEM",
        title,
        body,
        link: `/makler/workflow/${requestId}`,
      }),
    ),
  );
}

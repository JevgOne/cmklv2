import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { autoAssignRequest } from "./router";
import { calculateDueDate } from "./sla";
import { notifyWorkflow } from "./notifications";
import type { CreateWorkflowRequest } from "@/lib/validators/workflow";

export async function createWorkflowRequest(
  data: CreateWorkflowRequest,
  createdById: string,
) {
  // Auto-routing
  const assignment = await autoAssignRequest(data.type, createdById);
  const dueAt = calculateDueDate(data.type, data.priority ?? "NORMAL");

  // Determine initial status: ASSIGNED if person found, QUEUED if only role
  const initialStatus = assignment.assignedToId ? "ASSIGNED" : "QUEUED";

  const request = await prisma.workflowRequest.create({
    data: {
      type: data.type,
      category: data.category ?? null,
      title: data.title,
      description: data.description,
      priority: data.priority ?? "NORMAL",
      status: initialStatus,
      createdById,
      assignedToId: assignment.assignedToId ?? null,
      assignedRole: assignment.assignedRole,
      vehicleId: data.vehicleId ?? null,
      contactId: data.contactId ?? null,
      contractId: data.contractId ?? null,
      leadId: data.leadId ?? null,
      inquiryId: data.inquiryId ?? null,
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
      toStatus: initialStatus,
    },
  });

  // If auto-assigned to a person, add ASSIGNED step
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
  }

  // If queued (no person), add QUEUED step
  if (!assignment.assignedToId) {
    await prisma.workflowStep.create({
      data: {
        requestId: request.id,
        userId: createdById,
        action: "QUEUED",
        note: `Zařazeno do fronty (${assignment.assignedRole})`,
      },
    });
  }

  // Multi-role notifications: assignee + department + admins
  const createdByName = `${request.createdBy.firstName} ${request.createdBy.lastName}`;
  await notifyWorkflow({
    event: assignment.assignedToId ? "workflow:assigned" : "workflow:created",
    requestId: request.id,
    type: data.type,
    title: data.title,
    priority: data.priority ?? "NORMAL",
    assignedToId: assignment.assignedToId,
    assignedRole: assignment.assignedRole,
    createdByName,
    status: initialStatus,
  });

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

  // Fetch watchers with role to determine correct link
  const watchersWithRole = await prisma.user.findMany({
    where: { id: { in: watchers.map((w) => w.userId) } },
    select: { id: true, role: true },
  });
  const roleMap = new Map(watchersWithRole.map((u) => [u.id, u.role]));

  await Promise.all(
    watchers.map((w) => {
      const isAdmin = roleMap.get(w.userId) === "ADMIN";
      return createNotification({
        userId: w.userId,
        type: "SYSTEM",
        title,
        body,
        link: isAdmin ? `/admin/workflow/${requestId}` : `/makler/pozadavky/${requestId}`,
      });
    }),
  );
}

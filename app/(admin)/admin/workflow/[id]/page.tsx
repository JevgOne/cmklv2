import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AdminWorkflowDetail } from "@/components/admin/workflow/AdminWorkflowDetail";
import type { WorkflowRequestDetail } from "@/types/workflow";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"];

export default async function AdminWorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const [request, boUsers] = await Promise.all([
    prisma.workflowRequest.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, avatar: true, role: true, email: true, phone: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
        },
        vehicle: {
          select: { id: true, brand: true, model: true },
        },
        watchers: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        steps: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        comments: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        documents: {
          include: {
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"] },
        status: "ACTIVE",
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  if (!request) notFound();

  // Related requests — same creator or same vehicle
  const relatedRequests = await prisma.workflowRequest.findMany({
    where: {
      id: { not: request.id },
      OR: [
        { createdById: request.createdById },
        ...(request.vehicleId ? [{ vehicleId: request.vehicleId }] : []),
      ],
    },
    select: { id: true, title: true, type: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const serialized: WorkflowRequestDetail = {
    id: request.id,
    type: request.type as WorkflowRequestDetail["type"],
    category: request.category,
    title: request.title,
    description: request.description,
    priority: request.priority as WorkflowRequestDetail["priority"],
    status: request.status as WorkflowRequestDetail["status"],
    createdBy: request.createdBy,
    assignedTo: request.assignedTo,
    assignedRole: request.assignedRole,
    vehicleId: request.vehicleId,
    vehicleLabel: request.vehicle
      ? `${request.vehicle.brand} ${request.vehicle.model}`
      : null,
    dueAt: request.dueAt?.toISOString() ?? null,
    slaBreached: request.slaBreached,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    resolution: request.resolution,
    resolvedAt: request.resolvedAt?.toISOString() ?? null,
    metadata: request.metadata ? JSON.parse(request.metadata) : null,
    steps: request.steps.map((s) => ({
      id: s.id,
      action: s.action,
      fromStatus: s.fromStatus,
      toStatus: s.toStatus,
      note: s.note,
      performedBy: s.user,
      createdAt: s.createdAt.toISOString(),
    })),
    comments: request.comments.map((c) => ({
      id: c.id,
      content: c.content,
      isInternal: c.isInternal,
      author: c.user,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
    })),
    documents: request.documents.map((d) => ({
      id: d.id,
      name: d.name,
      url: d.url,
      type: d.mimeType,
      category: d.category,
      size: d.size,
      uploadedBy: d.uploadedBy,
      createdAt: d.createdAt.toISOString(),
    })),
  };

  const assignableUsers = boUsers.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
  }));

  // Compute response time (time from creation to first ASSIGNED step)
  const firstAssignStep = request.steps.find((s) => s.action === "ASSIGNED");
  const responseTimeMs = firstAssignStep
    ? firstAssignStep.createdAt.getTime() - request.createdAt.getTime()
    : null;

  return (
    <AdminWorkflowDetail
      request={serialized}
      userId={session.user.id}
      userRole={session.user.role}
      assignableUsers={assignableUsers}
      creatorContact={{
        email: request.createdBy.email ?? undefined,
        phone: request.createdBy.phone ?? undefined,
        role: request.createdBy.role,
      }}
      watchers={request.watchers.map((w) => ({
        id: w.user.id,
        name: [w.user.firstName, w.user.lastName].filter(Boolean).join(" ") || "—",
      }))}
      relatedRequests={relatedRequests.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }))}
      responseTimeMs={responseTimeMs}
    />
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminWorkflowDashboard } from "@/components/admin/workflow/AdminWorkflowDashboard";
import type { WorkflowRequestSummary, WorkflowStats } from "@/types/workflow";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR"];

export default async function AdminWorkflowPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [requests, totalCount, openCount, myAssignedCount, slaBreachedCount, boUsers] =
    await Promise.all([
      prisma.workflowRequest.findMany({
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          vehicle: {
            select: { id: true, brand: true, model: true },
          },
          _count: {
            select: { comments: true, documents: true },
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 100,
      }),
      prisma.workflowRequest.count(),
      prisma.workflowRequest.count({
        where: {
          status: {
            in: ["CREATED", "QUEUED", "ASSIGNED", "IN_PROGRESS", "WAITING_INFO", "WAITING_APPROVAL"],
          },
        },
      }),
      prisma.workflowRequest.count({
        where: { assignedToId: userId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      }),
      prisma.workflowRequest.count({
        where: { slaBreached: true, status: { notIn: ["CLOSED", "CANCELLED"] } },
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

  const serialized: WorkflowRequestSummary[] = requests.map((r) => ({
    id: r.id,
    type: r.type as WorkflowRequestSummary["type"],
    category: r.category,
    title: r.title,
    description: r.description,
    priority: r.priority as WorkflowRequestSummary["priority"],
    status: r.status as WorkflowRequestSummary["status"],
    createdBy: r.createdBy,
    assignedTo: r.assignedTo,
    assignedRole: r.assignedRole,
    vehicleId: r.vehicleId,
    vehicleLabel: r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : null,
    dueAt: r.dueAt?.toISOString() ?? null,
    slaBreached: r.slaBreached,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    _count: r._count,
  }));

  const stats: WorkflowStats = {
    total: totalCount,
    open: openCount,
    myAssigned: myAssignedCount,
    slaBreached: slaBreachedCount,
    byStatus: {},
    byPriority: {},
  };

  const assignableUsers = boUsers.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workflow požadavky</h1>
      </div>
      <AdminWorkflowDashboard
        requests={serialized}
        stats={stats}
        assignableUsers={assignableUsers}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WorkflowList } from "@/components/pwa/workflow/WorkflowList";
import type { WorkflowRequestSummary, WorkflowStats } from "@/types/workflow";

export const metadata: Metadata = {
  title: "Požadavky | Carmakler",
  description: "Přehled workflow požadavků makléře.",
};

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN", "BACKOFFICE"];

export default async function PozadavkyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [requests, totalCount, openCount, myAssignedCount, slaBreachedCount] =
    await Promise.all([
      prisma.workflowRequest.findMany({
        where: {
          OR: [
            { createdById: userId },
            { assignedToId: userId },
            { assignedRole: session.user.role },
          ],
        },
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
        take: 50,
      }),
      prisma.workflowRequest.count({
        where: {
          OR: [
            { createdById: userId },
            { assignedToId: userId },
            { assignedRole: session.user.role },
          ],
        },
      }),
      prisma.workflowRequest.count({
        where: {
          OR: [
            { createdById: userId },
            { assignedToId: userId },
            { assignedRole: session.user.role },
          ],
          status: {
            in: ["CREATED", "ASSIGNED", "IN_PROGRESS", "WAITING_INFO", "WAITING_APPROVAL"],
          },
        },
      }),
      prisma.workflowRequest.count({
        where: { assignedToId: userId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      }),
      prisma.workflowRequest.count({
        where: {
          OR: [
            { createdById: userId },
            { assignedToId: userId },
          ],
          slaBreached: true,
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
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

  return <WorkflowList initialRequests={serialized} initialStats={stats} userId={userId} />;
}

import { prisma } from "@/lib/prisma";
import { WORKFLOW_TYPES, type WorkflowType } from "./types";

interface AutoAssignResult {
  assignedToId?: string;
  assignedRole: string;
}

/**
 * Auto-assign workflow request based on type and creator.
 *
 * Routing hierarchy for BROKER-created requests:
 * 1. Find broker's manager (managerId) → that's their REGIONAL_DIRECTOR
 * 2. If no managerId → find any MANAGER with least active requests
 * 3. If no MANAGER → route to ADMIN
 *
 * BUG_REPORT always routes to ADMIN.
 */
export async function autoAssignRequest(
  type: string,
  createdById: string,
): Promise<AutoAssignResult> {
  const config = WORKFLOW_TYPES[type as WorkflowType];
  const defaultRole = config?.defaultRole ?? "MANAGER";

  // BUG_REPORT always goes to ADMIN
  if (type === "BUG_REPORT") {
    const admin = await findLeastBusyUser("ADMIN");
    if (admin) {
      return { assignedToId: admin, assignedRole: "ADMIN" };
    }
    return { assignedRole: "ADMIN" };
  }

  // 1. Try to find the creator's direct manager (managerId → REGIONAL_DIRECTOR)
  const creator = await prisma.user.findUnique({
    where: { id: createdById },
    select: { managerId: true, role: true },
  });

  if (creator?.managerId) {
    // Verify manager is active
    const manager = await prisma.user.findUnique({
      where: { id: creator.managerId },
      select: { id: true, status: true },
    });
    if (manager && manager.status === "ACTIVE") {
      return { assignedToId: manager.id, assignedRole: defaultRole };
    }
  }

  // 2. Find any MANAGER with least active requests (round-robin)
  const managerId = await findLeastBusyUser("MANAGER");
  if (managerId) {
    return { assignedToId: managerId, assignedRole: "MANAGER" };
  }

  // 3. Fallback to ADMIN
  const adminId = await findLeastBusyUser("ADMIN");
  if (adminId) {
    return { assignedToId: adminId, assignedRole: "ADMIN" };
  }

  // 4. No one available — assign to role only (QUEUED state)
  return { assignedRole: defaultRole };
}

async function findLeastBusyUser(role: string): Promise<string | null> {
  const candidates = await prisma.user.findMany({
    where: {
      role,
      status: "ACTIVE",
    },
    select: {
      id: true,
      _count: {
        select: {
          workflowRequestsAssigned: {
            where: {
              status: { in: ["ASSIGNED", "IN_PROGRESS", "WAITING_INFO", "QUEUED"] },
            },
          },
        },
      },
    },
    orderBy: {
      workflowRequestsAssigned: { _count: "asc" },
    },
    take: 1,
  });

  return candidates[0]?.id ?? null;
}

import { prisma } from "@/lib/prisma";
import { WORKFLOW_TYPES, type WorkflowType } from "./types";

interface AutoAssignResult {
  assignedToId?: string;
  assignedRole: string;
}

export async function autoAssignRequest(
  type: string,
  createdById: string,
): Promise<AutoAssignResult> {
  const config = WORKFLOW_TYPES[type as WorkflowType];
  const defaultRole = config?.defaultRole ?? "BACKOFFICE";

  // 1. Pokud typ vyžaduje MANAGER → přiřaď kreátorova manažera
  if (defaultRole === "MANAGER") {
    const creator = await prisma.user.findUnique({
      where: { id: createdById },
      select: { managerId: true },
    });
    if (creator?.managerId) {
      return { assignedToId: creator.managerId, assignedRole: "MANAGER" };
    }
  }

  // 2. Round-robin: najdi uživatele s nejméně otevřenými požadavky
  const candidates = await prisma.user.findMany({
    where: {
      role: defaultRole,
      status: "ACTIVE",
    },
    select: {
      id: true,
      _count: {
        select: {
          workflowRequestsAssigned: {
            where: {
              status: { in: ["ASSIGNED", "IN_PROGRESS", "WAITING_INFO"] },
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

  if (candidates[0]) {
    return { assignedToId: candidates[0].id, assignedRole: defaultRole };
  }

  // 3. Fallback — jen role bez konkrétní osoby
  return { assignedRole: defaultRole };
}

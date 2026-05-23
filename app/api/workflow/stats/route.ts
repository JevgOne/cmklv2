import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const isAdmin = userRole === "ADMIN";

    // Base where clause — ADMIN sees all, others see their own scope
    const scopeFilter = isAdmin
      ? {}
      : {
          OR: [
            { createdById: userId },
            { assignedToId: userId },
            { assignedRole: userRole },
          ],
        };

    const activeStatuses = ["CREATED", "QUEUED", "ASSIGNED", "IN_PROGRESS", "WAITING_INFO", "WAITING_APPROVAL"];

    const [
      totalOpen,
      assignedToMe,
      createdByMe,
      queuedForRole,
      slaBreached,
      resolvedToday,
      byType,
      byPriority,
    ] = await Promise.all([
      // Total open requests in scope
      prisma.workflowRequest.count({
        where: { ...scopeFilter, status: { in: activeStatuses } },
      }),

      // Assigned specifically to me
      prisma.workflowRequest.count({
        where: { assignedToId: userId, status: { in: activeStatuses } },
      }),

      // Created by me (still open)
      prisma.workflowRequest.count({
        where: { createdById: userId, status: { in: activeStatuses } },
      }),

      // Queued for my role (claim queue)
      prisma.workflowRequest.count({
        where: {
          status: "QUEUED",
          assignedRole: userRole,
          assignedToId: null,
        },
      }),

      // SLA breached in scope
      prisma.workflowRequest.count({
        where: {
          ...scopeFilter,
          slaBreached: true,
          status: { in: activeStatuses },
        },
      }),

      // Resolved today
      prisma.workflowRequest.count({
        where: {
          ...scopeFilter,
          status: { in: ["RESOLVED", "CLOSED"] },
          resolvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Breakdown by type (open only)
      prisma.workflowRequest.groupBy({
        by: ["type"],
        where: { ...scopeFilter, status: { in: activeStatuses } },
        _count: true,
      }),

      // Breakdown by priority (open only)
      prisma.workflowRequest.groupBy({
        by: ["priority"],
        where: { ...scopeFilter, status: { in: activeStatuses } },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalOpen,
        assignedToMe,
        createdByMe,
        queuedForRole,
        slaBreached,
        resolvedToday,
        byType: byType.map((t) => ({ type: t.type, count: t._count })),
        byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
      },
    });
  } catch (error) {
    console.error("GET /api/workflow/stats error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

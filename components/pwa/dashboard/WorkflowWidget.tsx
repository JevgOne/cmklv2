import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";

interface WorkflowWidgetProps {
  userId: string;
  userRole: string;
}

export async function WorkflowWidget({ userId, userRole }: WorkflowWidgetProps) {
  const isAdmin = userRole === "ADMIN";

  const activeStatuses = ["CREATED", "QUEUED", "ASSIGNED", "IN_PROGRESS", "WAITING_INFO", "WAITING_APPROVAL"];

  const scopeFilter = isAdmin
    ? {}
    : {
        OR: [
          { createdById: userId },
          { assignedToId: userId },
          { assignedRole: userRole },
        ],
      };

  const [assignedToMe, createdByMe, slaBreached, recentRequests] = await Promise.all([
    prisma.workflowRequest.count({
      where: { assignedToId: userId, status: { in: activeStatuses } },
    }),
    prisma.workflowRequest.count({
      where: { createdById: userId, status: { in: activeStatuses } },
    }),
    prisma.workflowRequest.count({
      where: {
        ...scopeFilter,
        slaBreached: true,
        status: { in: activeStatuses },
      },
    }),
    prisma.workflowRequest.findMany({
      where: {
        ...scopeFilter,
        status: { in: activeStatuses },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    }),
  ]);

  const totalActive = assignedToMe + createdByMe;
  if (totalActive === 0 && recentRequests.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Požadavky</h3>
        <Link
          href="/makler/pozadavky"
          className="text-xs font-medium text-orange-600 hover:text-orange-700 no-underline"
        >
          Zobrazit vše
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Card className="p-3 text-center">
          <p className="text-lg font-bold text-orange-500">{assignedToMe}</p>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
            Přiřazeno mně
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{createdByMe}</p>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
            Moje otevřené
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className={`text-lg font-bold ${slaBreached > 0 ? "text-red-500" : "text-gray-900"}`}>
            {slaBreached}
          </p>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
            SLA!
          </p>
        </Card>
      </div>

      {/* Recent items */}
      {recentRequests.length > 0 && (
        <div className="space-y-2">
          {recentRequests.map((r) => (
            <Link
              key={r.id}
              href={`/makler/pozadavky/${r.id}`}
              className="block no-underline"
            >
              <Card className="p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                  <p className="text-xs text-gray-400">
                    {r.status === "QUEUED" ? "Ve frontě" : r.status === "ASSIGNED" ? "Přiřazeno" : r.status === "IN_PROGRESS" ? "Řeší se" : r.status}
                    {r.priority === "URGENT" && " • Urgentní"}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

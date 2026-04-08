import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ADMIN/BACKOFFICE — citlivá obchodní data (sazby + důvody změn).
function canViewCommissionHistory(role: string | undefined): boolean {
  return role === "ADMIN" || role === "BACKOFFICE";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canViewCommissionHistory(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id: partnerId } = await params;

    const history = await prisma.partnerCommissionLog.findMany({
      where: { partnerId },
      include: {
        changedBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { changedAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      history.map((entry) => ({
        id: entry.id,
        oldRate: Number(entry.oldRate),
        newRate: Number(entry.newRate),
        reason: entry.reason,
        changedAt: entry.changedAt.toISOString(),
        changedBy: entry.changedBy,
      }))
    );
  } catch (error) {
    console.error(
      "GET /api/admin/partners/[id]/commission/history error:",
      error
    );
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

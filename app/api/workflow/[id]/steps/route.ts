import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "MANAGER", "REGIONAL_DIRECTOR", "BROKER"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Přístup odepřen" }, { status: 403 });
    }

    const { id } = await params;

    const steps = await prisma.workflowStep.findMany({
      where: { requestId: id },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    return NextResponse.json({ steps });
  } catch (error) {
    console.error("GET /api/workflow/[id]/steps error:", error);
    return NextResponse.json({ error: "Interní chyba serveru" }, { status: 500 });
  }
}

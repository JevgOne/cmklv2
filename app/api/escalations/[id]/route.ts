import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateEscalationSchema } from "@/lib/validators/escalation";
import { createNotification } from "@/lib/notifications";

const ALLOWED_ROLES = ["MANAGER", "REGIONAL_DIRECTOR", "ADMIN", "BACKOFFICE"];

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Otevřeno",
  IN_PROGRESS: "V řešení",
  RESOLVED: "Vyřešeno",
  CLOSED: "Uzavřeno",
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nedostatečná oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const body = await request.json();
    const parsed = updateEscalationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const escalation = await prisma.escalation.findUnique({
      where: { id },
      select: { id: true, brokerId: true, status: true },
    });

    if (!escalation) {
      return NextResponse.json({ error: "Eskalace nenalezena" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status) {
      updateData.status = parsed.data.status;
      if (parsed.data.status === "RESOLVED" || parsed.data.status === "CLOSED") {
        updateData.resolvedAt = new Date();
      }
    }
    if (parsed.data.resolution !== undefined) updateData.resolution = parsed.data.resolution;

    const updated = await prisma.escalation.update({
      where: { id },
      data: updateData,
    });

    if (parsed.data.status && parsed.data.status !== escalation.status) {
      await createNotification({
        userId: escalation.brokerId,
        type: "SYSTEM",
        title: "Změna stavu eskalace",
        body: `Vaše eskalace byla změněna na stav: ${STATUS_LABELS[parsed.data.status] || parsed.data.status}`,
        link: `/makler/escalations`,
      });
    }

    return NextResponse.json({ escalation: updated });
  } catch (error) {
    console.error("PUT /api/escalations/[id] error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

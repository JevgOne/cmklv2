import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ACTIVATE_ROLES = ["MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

// PUT /api/admin/brokers/[id]/activate — aktivace makléře (ONBOARDING → ACTIVE)
export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (!ACTIVATE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    // Najít makléře
    const broker = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        status: true,
        onboardingCompleted: true,
        managerId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!broker) {
      return NextResponse.json(
        { error: "Makléř nebyl nalezen" },
        { status: 404 }
      );
    }

    if (broker.role !== "BROKER") {
      return NextResponse.json(
        { error: "Uživatel není makléř" },
        { status: 400 }
      );
    }

    if (broker.status !== "ONBOARDING") {
      return NextResponse.json(
        { error: "Makléř není ve stavu onboardingu" },
        { status: 400 }
      );
    }

    if (!broker.onboardingCompleted) {
      return NextResponse.json(
        { error: "Makléř ještě nedokončil onboarding" },
        { status: 400 }
      );
    }

    // Manager může aktivovat jen své makléře
    if (
      session.user.role === "MANAGER" &&
      broker.managerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Nemáte oprávnění aktivovat tohoto makléře" },
        { status: 403 }
      );
    }

    // Aktivace
    const updatedBroker = await prisma.user.update({
      where: { id },
      data: { status: "ACTIVE" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    return NextResponse.json({
      message: `Makléř ${updatedBroker.firstName} ${updatedBroker.lastName} byl aktivován`,
      broker: updatedBroker,
    });
  } catch (error) {
    console.error("Activate broker error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["MANAGER", "REGIONAL_DIRECTOR", "ADMIN", "BACKOFFICE"];

// POST /api/admin/brokers/[id]/reject — zamítnutí makléře v onboardingu
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const { id } = await params;

    const broker = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        status: true,
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

    // Manager může zamítnout jen své makléře
    if (
      session.user.role === "MANAGER" &&
      broker.managerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Nemáte oprávnění zamítnout tohoto makléře" },
        { status: 403 }
      );
    }

    const updatedBroker = await prisma.user.update({
      where: { id },
      data: { status: "REJECTED" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    return NextResponse.json({
      message: `Makléř ${updatedBroker.firstName} ${updatedBroker.lastName} byl zamítnut`,
      broker: updatedBroker,
    });
  } catch (error) {
    console.error("Reject broker error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Neprihlasen" }, { status: 401 });
    }

    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const managerId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Pocet makleru
    const totalBrokers = await prisma.user.count({
      where: { managerId, role: "BROKER", status: "ACTIVE" },
    });

    // Aktivni vozidla
    const activeVehicles = await prisma.vehicle.count({
      where: {
        broker: { managerId },
        status: "ACTIVE",
      },
    });

    // Cekajici na schvaleni
    const pendingVehicles = await prisma.vehicle.count({
      where: {
        broker: { managerId },
        status: "PENDING",
      },
    });

    // Provize za mesic
    const teamCommissions = await prisma.commission.aggregate({
      where: {
        broker: { managerId },
        soldAt: { gte: startOfMonth },
      },
      _sum: { commission: true },
      _count: true,
    });

    // Makleri cekajici na aktivaci
    const pendingOnboarding = await prisma.user.count({
      where: {
        managerId,
        role: "BROKER",
        status: "ONBOARDING",
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      totalBrokers,
      activeVehicles,
      pendingVehicles,
      pendingOnboarding,
      monthlyCommission: teamCommissions._sum.commission ?? 0,
      monthlySales: teamCommissions._count,
    });
  } catch (error) {
    console.error("Manager stats error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

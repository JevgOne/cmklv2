import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Neprihlaseny" },
        { status: 401 }
      );
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: "Pristup odepren" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [commissionAgg, salesCount, activeVehicles] = await Promise.all([
      // Celkova provize tento mesic
      prisma.commission.aggregate({
        where: {
          brokerId: userId,
          createdAt: { gte: startOfMonth },
        },
        _sum: { commission: true },
      }),
      // Pocet prodej tento mesic
      prisma.commission.count({
        where: {
          brokerId: userId,
          createdAt: { gte: startOfMonth },
        },
      }),
      // Aktivni vozidla
      prisma.vehicle.count({
        where: {
          brokerId: userId,
          status: "ACTIVE",
        },
      }),
    ]);

    return NextResponse.json({
      totalCommission: commissionAgg._sum.commission ?? 0,
      salesCount,
      activeVehicles,
    });
  } catch (error) {
    console.error("GET /api/broker/stats error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

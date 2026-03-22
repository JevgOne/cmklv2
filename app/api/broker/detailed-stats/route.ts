import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Neprihlaseny" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Pristup odepren" }, { status: 403 });
    }

    const userId = session.user.id;

    const [
      totalVehicles,
      soldVehicles,
      userCommissions,
      allBrokersCommissions,
      allBrokersVehicles,
      allBrokersSold,
      soldVehicleDetails,
    ] = await Promise.all([
      // Celkem nabranych aut
      prisma.vehicle.count({ where: { brokerId: userId } }),
      // Celkem prodanych
      prisma.vehicle.count({ where: { brokerId: userId, status: "SOLD" } }),
      // Provize uzivatele
      prisma.commission.aggregate({
        where: { brokerId: userId },
        _sum: { commission: true },
        _avg: { commission: true },
        _count: true,
      }),
      // Prumer vsech brokeru - provize
      prisma.commission.aggregate({
        _avg: { commission: true },
        _count: true,
      }),
      // Prumer vsech - celkem aut
      prisma.vehicle.count(),
      // Prumer vsech - prodanych
      prisma.vehicle.count({ where: { status: "SOLD" } }),
      // Detaily prodanych aut (pro top znacky, cenovy segment, prumernou dobu)
      prisma.vehicle.findMany({
        where: { brokerId: userId, status: "SOLD" },
        select: {
          brand: true,
          soldPrice: true,
          price: true,
          createdAt: true,
          soldAt: true,
        },
      }),
    ]);

    // Prumerna doba prodeje (dny)
    const saleDurations = soldVehicleDetails
      .filter((v) => v.soldAt)
      .map((v) => {
        const diffMs = v.soldAt!.getTime() - v.createdAt.getTime();
        return diffMs / (1000 * 60 * 60 * 24);
      });
    const avgSaleDays =
      saleDurations.length > 0
        ? Math.round(saleDurations.reduce((a, b) => a + b, 0) / saleDurations.length)
        : 0;

    // Prumerna doba pro vsechny brokery
    const allSoldVehicles = await prisma.vehicle.findMany({
      where: { status: "SOLD", soldAt: { not: null } },
      select: { createdAt: true, soldAt: true },
    });
    const allDurations = allSoldVehicles
      .filter((v) => v.soldAt)
      .map((v) => (v.soldAt!.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const avgAllSaleDays =
      allDurations.length > 0
        ? Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length)
        : 0;

    // Konverzni pomer
    const conversionRate = totalVehicles > 0 ? Math.round((soldVehicles / totalVehicles) * 100) : 0;

    // Prumerny konverzni pomer vsech
    const totalBrokers = await prisma.user.count({ where: { role: "BROKER" } });
    const avgConversionRate =
      allBrokersVehicles > 0
        ? Math.round((allBrokersSold / allBrokersVehicles) * 100)
        : 0;

    // Top znacky
    const brandCounts: Record<string, number> = {};
    soldVehicleDetails.forEach((v) => {
      brandCounts[v.brand] = (brandCounts[v.brand] ?? 0) + 1;
    });
    const topBrands = Object.entries(brandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([brand, count]) => ({ brand, count }));

    // Cenovy segment
    const priceSegments = { "do300k": 0, "300k600k": 0, "600k1m": 0, "nad1m": 0 };
    soldVehicleDetails.forEach((v) => {
      const price = v.soldPrice ?? v.price;
      if (price < 300_000) priceSegments["do300k"]++;
      else if (price < 600_000) priceSegments["300k600k"]++;
      else if (price < 1_000_000) priceSegments["600k1m"]++;
      else priceSegments["nad1m"]++;
    });

    // Prodeje po mesicich (poslednich 6 mesicu)
    const now = new Date();
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthSales = await prisma.commission.aggregate({
        where: {
          brokerId: userId,
          soldAt: { gte: monthStart, lt: monthEnd },
        },
        _sum: { commission: true },
        _count: true,
      });
      monthlyStats.push({
        month: monthStart.toISOString().slice(0, 7),
        sales: monthSales._count,
        commission: monthSales._sum.commission ?? 0,
      });
    }

    return NextResponse.json({
      overview: {
        totalVehicles,
        soldVehicles,
        conversionRate,
        avgSaleDays,
        avgCommission: Math.round(userCommissions._avg.commission ?? 0),
        totalCommission: userCommissions._sum.commission ?? 0,
        totalSales: userCommissions._count,
      },
      comparison: {
        avgConversionRate,
        avgSaleDays: avgAllSaleDays,
        avgCommission: Math.round(allBrokersCommissions._avg.commission ?? 0),
        totalBrokers,
      },
      topBrands,
      priceSegments,
      monthlyStats,
    });
  } catch (error) {
    console.error("GET /api/broker/detailed-stats error:", error);
    return NextResponse.json({ error: "Interni chyba serveru" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BONUS_PER_SALE = 2500;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Neprihlasen" }, { status: 401 });
    }

    if (session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    // Najdi makléře pod tímto manažerem
    const teamBrokers = await prisma.user.findMany({
      where: { managerId: session.user.id, role: "BROKER" },
      select: { id: true },
    });

    const brokerIds = teamBrokers.map((b) => b.id);

    // Načti prodeje (PAID commissions)
    const commissions = await prisma.commission.findMany({
      where: {
        brokerId: { in: brokerIds },
        status: "PAID",
      },
      select: {
        soldAt: true,
        salePrice: true,
        commission: true,
        brokerId: true,
      },
      orderBy: { soldAt: "desc" },
    });

    // Aktuální měsíc
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthSales = commissions.filter(
      (c) => new Date(c.soldAt) >= currentMonthStart
    ).length;

    const currentMonthBonus = currentMonthSales * BONUS_PER_SALE;

    // Seskupit po měsících
    const monthlyMap = new Map<string, number>();
    for (const c of commissions) {
      const date = new Date(c.soldAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
    }

    const history = Array.from(monthlyMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, sales]) => ({
        month,
        sales,
        bonus: sales * BONUS_PER_SALE,
      }));

    return NextResponse.json({
      currentMonth: {
        sales: currentMonthSales,
        bonus: currentMonthBonus,
      },
      totalSales: commissions.length,
      totalBonus: commissions.length * BONUS_PER_SALE,
      bonusPerSale: BONUS_PER_SALE,
      history,
    });
  } catch (error) {
    console.error("Manager bonuses error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);

    // Default: aktualni mesic
    const now = new Date();
    const monthParam = searchParams.get("month"); // format: 2026-03
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-indexed

    if (monthParam) {
      const parts = monthParam.split("-");
      const parsedYear = parseInt(parts[0], 10);
      const parsedMonth = parseInt(parts[1], 10) - 1; // 0-indexed
      if (!isNaN(parsedYear) && !isNaN(parsedMonth) && parsedMonth >= 0 && parsedMonth <= 11) {
        year = parsedYear;
        month = parsedMonth;
      }
    }

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 1);

    const commissions = await prisma.commission.findMany({
      where: {
        brokerId: userId,
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            variant: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Statistiky
    let total = 0;
    let paid = 0;
    let pending = 0;

    for (const c of commissions) {
      total += c.commission;
      if (c.status === "PAID") {
        paid += c.commission;
      } else {
        pending += c.commission;
      }
    }

    return NextResponse.json({
      stats: { total, paid, pending },
      commissions,
    });
  } catch (error) {
    console.error("GET /api/broker/commissions error:", error);
    return NextResponse.json(
      { error: "Interni chyba serveru" },
      { status: 500 }
    );
  }
}

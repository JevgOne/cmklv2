import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PARTNER_ROLES = ["PARTNER_BAZAR", "PARTNER_VRAKOVISTE", "PARTS_SUPPLIER", "WHOLESALE_SUPPLIER"];

const MONTH_LABELS = ["led", "uno", "bre", "dub", "kve", "cer", "cvc", "srp", "zar", "rij", "lis", "pro"];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !PARTNER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Nemate opravneni" }, { status: 403 });
    }

    const monthsParam = new URL(request.url).searchParams.get("months") || "6";
    const months = Math.min(12, Math.max(1, parseInt(monthsParam, 10)));

    if (session.user.role === "PARTNER_BAZAR") {
      const salesData = await prisma.$queryRaw<Array<{
        month: Date;
        count: bigint;
        revenue: bigint | null;
      }>>`
        SELECT
          date_trunc('month', "soldAt") as month,
          COUNT(*)::bigint as count,
          COALESCE(SUM("soldPrice"), 0)::bigint as revenue
        FROM "Vehicle"
        WHERE "brokerId" = ${session.user.id}
          AND "status" = 'SOLD'
          AND "soldAt" IS NOT NULL
          AND "soldAt" >= NOW() - (${months} || ' months')::interval
        GROUP BY date_trunc('month', "soldAt")
        ORDER BY month
      `;

      const partner = await prisma.partner.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      let leadsData: Array<{ month: Date; count: bigint }> = [];
      if (partner) {
        leadsData = await prisma.$queryRaw<Array<{ month: Date; count: bigint }>>`
          SELECT
            date_trunc('month', "createdAt") as month,
            COUNT(*)::bigint as count
          FROM "PartnerLead"
          WHERE "partnerId" = ${partner.id}
            AND "createdAt" >= NOW() - (${months} || ' months')::interval
          GROUP BY date_trunc('month', "createdAt")
          ORDER BY month
        `;
      }

      const result = buildMonthlyData(months, salesData, leadsData);
      return NextResponse.json({ type: "BAZAR", months: result });

    } else {
      // PARTNER_VRAKOVISTE
      const ordersData = await prisma.$queryRaw<Array<{
        month: Date;
        count: bigint;
        revenue: bigint | null;
      }>>`
        SELECT
          date_trunc('month', o."createdAt") as month,
          COUNT(DISTINCT o."id")::bigint as count,
          COALESCE(SUM(oi."totalPrice"), 0)::bigint as revenue
        FROM "OrderItem" oi
        JOIN "Order" o ON o."id" = oi."orderId"
        WHERE oi."supplierId" = ${session.user.id}
          AND o."createdAt" >= NOW() - (${months} || ' months')::interval
        GROUP BY date_trunc('month', o."createdAt")
        ORDER BY month
      `;

      const result = buildMonthlyData(months, ordersData, []);
      return NextResponse.json({ type: "VRAKOVISTE", months: result });
    }
  } catch (error) {
    console.error("GET /api/partner/stats/charts error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

interface MonthEntry {
  label: string;
  month: string;
  count: number;
  revenue: number;
  leads?: number;
}

function buildMonthlyData(
  months: number,
  primaryData: Array<{ month: Date; count: bigint; revenue?: bigint | null }>,
  leadsData: Array<{ month: Date; count: bigint }>,
): MonthEntry[] {
  const now = new Date();
  const result: MonthEntry[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = MONTH_LABELS[d.getMonth()];

    const primary = primaryData.find(r => {
      const rd = new Date(r.month);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    });

    const leads = leadsData.find(r => {
      const rd = new Date(r.month);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    });

    result.push({
      label,
      month: key,
      count: primary ? Number(primary.count) : 0,
      revenue: primary?.revenue ? Number(primary.revenue) : 0,
      ...(leadsData.length > 0 ? { leads: leads ? Number(leads.count) : 0 } : {}),
    });
  }

  return result;
}

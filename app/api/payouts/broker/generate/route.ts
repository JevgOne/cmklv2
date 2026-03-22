import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePayoutSchema } from "@/lib/validators/payment";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "BACKOFFICE"
    ) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = generatePayoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { period } = parsed.data;

    // Najít schválené provize za dané období, které ještě nemají payout
    const [year, month] = period.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const commissions = await prisma.commission.findMany({
      where: {
        status: "APPROVED",
        payoutId: null,
        soldAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        broker: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (commissions.length === 0) {
      return NextResponse.json(
        { error: "Žádné provize k uzávěrce za toto období" },
        { status: 400 }
      );
    }

    // Seskupit provize podle makléře
    const byBroker = new Map<
      string,
      { brokerName: string; commissionIds: string[]; totalAmount: number }
    >();

    for (const c of commissions) {
      const existing = byBroker.get(c.brokerId);
      const brokerShare = c.brokerShare || 0;

      if (existing) {
        existing.commissionIds.push(c.id);
        existing.totalAmount += brokerShare;
      } else {
        byBroker.set(c.brokerId, {
          brokerName: `${c.broker.firstName} ${c.broker.lastName}`,
          commissionIds: [c.id],
          totalAmount: brokerShare,
        });
      }
    }

    // Vytvořit BrokerPayout pro každého makléře
    const created: string[] = [];

    for (const [brokerId, data] of byBroker) {
      // Kontrola, zda už neexistuje payout pro tohoto makléře a období
      const existing = await prisma.brokerPayout.findFirst({
        where: { brokerId, period },
      });

      if (existing) continue;

      const payout = await prisma.brokerPayout.create({
        data: {
          brokerId,
          period,
          totalAmount: data.totalAmount,
          status: "PENDING_INVOICE",
        },
      });

      // Propojit provize s payoutem
      await prisma.commission.updateMany({
        where: { id: { in: data.commissionIds } },
        data: { payoutId: payout.id },
      });

      // Notifikace makléři
      await prisma.notification.create({
        data: {
          userId: brokerId,
          type: "COMMISSION",
          title: "Provize k fakturaci",
          body: `Provize za období ${period}: ${data.totalAmount.toLocaleString("cs-CZ")} Kč. Nahrajte fakturu pro vyplacení.`,
          link: "/makler/provize",
        },
      });

      created.push(payout.id);
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      period,
    });
  } catch (error) {
    console.error("Generate payouts error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    // Makléř vidí jen své výplaty, admin/backoffice vidí všechny
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "BACKOFFICE";
    const isBroker = session.user.role === "BROKER";

    if (!isAdmin && !isBroker) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const where = isBroker ? { brokerId: session.user.id } : {};

    const payouts = await prisma.brokerPayout.findMany({
      where,
      include: {
        broker: {
          select: { firstName: true, lastName: true, email: true },
        },
        commissions: {
          select: {
            id: true,
            salePrice: true,
            brokerShare: true,
            vehicle: { select: { brand: true, model: true } },
          },
        },
        approvedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = payouts.map((p) => ({
      id: p.id,
      brokerName: `${p.broker.firstName} ${p.broker.lastName}`,
      brokerEmail: p.broker.email,
      period: p.period,
      totalAmount: p.totalAmount,
      invoiceUrl: p.invoiceUrl,
      invoiceNumber: p.invoiceNumber,
      status: p.status,
      approvedByName: p.approvedBy
        ? `${p.approvedBy.firstName} ${p.approvedBy.lastName}`
        : null,
      paidAt: p.paidAt,
      commissions: p.commissions.map((c) => ({
        id: c.id,
        vehicleName: `${c.vehicle.brand} ${c.vehicle.model}`,
        salePrice: c.salePrice,
        brokerShare: c.brokerShare,
      })),
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ payouts: result });
  } catch (error) {
    console.error("Broker payouts error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

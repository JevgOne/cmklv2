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

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "BACKOFFICE"
    ) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            slug: true,
            brokerId: true,
            broker: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        confirmedBy: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = payments.map((p) => ({
      id: p.id,
      vehicleName: `${p.vehicle.brand} ${p.vehicle.model}`,
      vehicleSlug: p.vehicle.slug,
      buyerName: p.buyerName,
      buyerEmail: p.buyerEmail,
      amount: p.amount,
      method: p.method,
      status: p.status,
      variableSymbol: p.variableSymbol,
      brokerName: p.vehicle.broker
        ? `${p.vehicle.broker.firstName} ${p.vehicle.broker.lastName}`
        : null,
      confirmedByName: p.confirmedBy
        ? `${p.confirmedBy.firstName} ${p.confirmedBy.lastName}`
        : null,
      confirmedAt: p.confirmedAt,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ payments: result });
  } catch (error) {
    console.error("Payments list error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

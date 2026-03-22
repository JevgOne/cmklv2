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

    const payouts = await prisma.sellerPayout.findMany({
      include: {
        vehicle: {
          select: { brand: true, model: true, slug: true },
        },
        payment: {
          select: { method: true, buyerName: true, confirmedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = payouts.map((p) => ({
      id: p.id,
      vehicleName: `${p.vehicle.brand} ${p.vehicle.model}`,
      vehicleSlug: p.vehicle.slug,
      sellerName: p.sellerName,
      sellerBankAccount: p.sellerBankAccount,
      amount: p.amount,
      commissionAmount: p.commissionAmount,
      status: p.status,
      paidAt: p.paidAt,
      bankReference: p.bankReference,
      paymentMethod: p.payment.method,
      buyerName: p.payment.buyerName,
      paymentConfirmedAt: p.payment.confirmedAt,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ payouts: result });
  } catch (error) {
    console.error("Seller payouts error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

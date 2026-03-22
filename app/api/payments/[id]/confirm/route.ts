import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCommission } from "@/lib/stripe";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: {
            broker: { select: { id: true, managerId: true } },
            contracts: {
              where: { type: "BROKERAGE" },
              select: { sellerName: true, sellerBankAccount: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Platba nenalezena" },
        { status: 404 }
      );
    }

    if (payment.status === "PAID") {
      return NextResponse.json(
        { error: "Platba je již potvrzena" },
        { status: 400 }
      );
    }

    // Potvrdit platbu
    await prisma.payment.update({
      where: { id },
      data: {
        status: "PAID",
        confirmedAt: new Date(),
        confirmedById: session.user.id,
      },
    });

    // Aktualizovat stav vozidla
    await prisma.vehicle.update({
      where: { id: payment.vehicleId },
      data: { status: "PAID" },
    });

    // Vytvořit výplatu prodejci a rozdělit provizi
    const { commission, brokerShare, companyShare, managerBonus, sellerPayout } =
      calculateCommission(payment.amount);

    const contract = payment.vehicle.contracts[0];
    await prisma.sellerPayout.create({
      data: {
        vehicleId: payment.vehicleId,
        paymentId: payment.id,
        sellerName:
          contract?.sellerName ||
          payment.vehicle.sellerName ||
          "Neznámý",
        sellerBankAccount: contract?.sellerBankAccount || "",
        amount: sellerPayout,
        commissionAmount: commission,
        status: "PENDING",
      },
    });

    // Aktualizovat / vytvořit Commission
    if (payment.vehicle.brokerId) {
      const existingCommission = await prisma.commission.findFirst({
        where: {
          vehicleId: payment.vehicleId,
          brokerId: payment.vehicle.brokerId,
        },
      });

      if (existingCommission) {
        await prisma.commission.update({
          where: { id: existingCommission.id },
          data: {
            salePrice: payment.amount,
            commission,
            brokerShare,
            companyShare,
            managerBonus,
            status: "APPROVED",
          },
        });
      } else {
        await prisma.commission.create({
          data: {
            brokerId: payment.vehicle.brokerId,
            vehicleId: payment.vehicleId,
            salePrice: payment.amount,
            commission,
            rate: commission / payment.amount,
            brokerShare,
            companyShare,
            managerBonus,
            status: "APPROVED",
            soldAt: new Date(),
          },
        });
      }

      // Notifikace makléři
      await prisma.notification.create({
        data: {
          userId: payment.vehicle.brokerId,
          type: "COMMISSION",
          title: "Platba potvrzena",
          body: `Platba ${payment.amount.toLocaleString("cs-CZ")} Kč za ${payment.vehicle.brand} ${payment.vehicle.model} byla potvrzena. Domluvte předání vozidla.`,
          link: `/makler/vehicles/${payment.vehicleId}`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

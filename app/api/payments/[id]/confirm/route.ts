import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPayoutRecords } from "@/lib/stripe";

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
          select: {
            id: true,
            brand: true,
            model: true,
            brokerId: true,
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
    await createPayoutRecords(payment.id, payment.vehicleId, payment.amount);

    // Notifikace makléři
    if (payment.vehicle.brokerId) {
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

    // Email kupujícímu
    const vehicleName = `${payment.vehicle.brand} ${payment.vehicle.model}`;
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
        to: payment.buyerEmail,
        subject: "Potvrzení platby | Carmakler",
        html: `<p>Vaše platba ${payment.amount.toLocaleString("cs-CZ")} Kč za ${vehicleName} byla přijata.</p><p>Děkujeme za nákup přes Carmakler.</p>`,
        text: `Vaše platba ${payment.amount.toLocaleString("cs-CZ")} Kč za ${vehicleName} byla přijata. Děkujeme za nákup přes Carmakler.`,
      });
    } catch (emailErr) {
      console.error("Failed to send payment confirmation email:", emailErr);
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

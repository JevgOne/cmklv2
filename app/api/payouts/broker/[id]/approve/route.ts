import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  _request: NextRequest,
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

    const payout = await prisma.brokerPayout.findUnique({
      where: { id },
    });

    if (!payout) {
      return NextResponse.json(
        { error: "Výplata nenalezena" },
        { status: 404 }
      );
    }

    if (payout.status !== "INVOICE_UPLOADED") {
      return NextResponse.json(
        { error: "Faktura musí být nahrána před schválením" },
        { status: 400 }
      );
    }

    await prisma.brokerPayout.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
      },
    });

    // Notifikace makléři
    await prisma.notification.create({
      data: {
        userId: payout.brokerId,
        type: "COMMISSION",
        title: "Faktura schválena",
        body: `Vaše faktura za období ${payout.period} byla schválena. Výplata ${payout.totalAmount.toLocaleString("cs-CZ")} Kč bude provedena do 14 dní.`,
        link: "/makler/provize",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve payout error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

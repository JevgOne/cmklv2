import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processSellerPayoutSchema } from "@/lib/validators/payment";

export async function POST(
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
    const body = await request.json();
    const parsed = processSellerPayoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payout = await prisma.sellerPayout.findUnique({
      where: { id },
    });

    if (!payout) {
      return NextResponse.json(
        { error: "Výplata nenalezena" },
        { status: 404 }
      );
    }

    if (payout.status === "PAID") {
      return NextResponse.json(
        { error: "Výplata je již zpracována" },
        { status: 400 }
      );
    }

    await prisma.sellerPayout.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        bankReference: parsed.data.bankReference,
      },
    });

    // Email prodejci
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: payout.vehicleId },
      select: { sellerEmail: true, brand: true, model: true },
    });

    if (vehicle?.sellerEmail) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
          to: vehicle.sellerEmail,
          subject: "Výplata z prodeje vozidla | Carmakler",
          html: `<p>Částka ${payout.amount.toLocaleString("cs-CZ")} Kč za prodej vozidla ${vehicle.brand} ${vehicle.model} byla odeslána na váš účet.</p><p>Děkujeme, že jste prodávali přes Carmakler.</p>`,
          text: `Částka ${payout.amount.toLocaleString("cs-CZ")} Kč za prodej vozidla ${vehicle.brand} ${vehicle.model} byla odeslána na váš účet. Děkujeme, že jste prodávali přes Carmakler.`,
        });
      } catch (emailErr) {
        console.error("Failed to send seller payout email:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Process seller payout error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

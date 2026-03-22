import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadInvoiceSchema } from "@/lib/validators/payment";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Nepřihlášen" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = uploadInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatná data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payout = await prisma.brokerPayout.findUnique({
      where: { id },
    });

    if (!payout) {
      return NextResponse.json(
        { error: "Výplata nenalezena" },
        { status: 404 }
      );
    }

    // Makléř může nahrát fakturu jen ke svým výplatám
    if (
      session.user.role === "BROKER" &&
      payout.brokerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Nemáte oprávnění" }, { status: 403 });
    }

    if (
      payout.status !== "PENDING_INVOICE" &&
      payout.status !== "INVOICE_UPLOADED"
    ) {
      return NextResponse.json(
        { error: "Faktura nemůže být nahrána v tomto stavu" },
        { status: 400 }
      );
    }

    await prisma.brokerPayout.update({
      where: { id },
      data: {
        invoiceUrl: parsed.data.invoiceUrl,
        invoiceNumber: parsed.data.invoiceNumber,
        status: "INVOICE_UPLOADED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload invoice error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

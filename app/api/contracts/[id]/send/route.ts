import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, RESEND_FROM_CONTRACTS } from "@/lib/resend";

/* ------------------------------------------------------------------ */
/*  POST /api/contracts/[id]/send — Odeslání smlouvy emailem           */
/* ------------------------------------------------------------------ */

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Přístup odepřen" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: { brand: true, model: true, year: true },
        },
        broker: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Smlouva nenalezena" },
        { status: 404 }
      );
    }

    if (contract.brokerId !== session.user.id) {
      return NextResponse.json(
        { error: "Přístup odepřen" },
        { status: 403 }
      );
    }

    if (!contract.pdfUrl) {
      return NextResponse.json(
        { error: "PDF ještě nebylo vygenerováno" },
        { status: 400 }
      );
    }

    if (!contract.sellerEmail) {
      return NextResponse.json(
        { error: "Prodejce nemá zadaný email" },
        { status: 400 }
      );
    }

    // Convert base64 PDF to buffer for attachment
    let pdfBuffer: Buffer;
    if (contract.pdfUrl.startsWith("data:application/pdf;base64,")) {
      const base64Data = contract.pdfUrl.replace(
        "data:application/pdf;base64,",
        ""
      );
      pdfBuffer = Buffer.from(base64Data, "base64");
    } else {
      // If it's a URL, fetch the PDF
      const response = await fetch(contract.pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    }

    const vehicleName = contract.vehicle
      ? `${contract.vehicle.brand} ${contract.vehicle.model} (${contract.vehicle.year})`
      : "vozidlo";
    const brokerName = `${contract.broker.firstName} ${contract.broker.lastName}`;
    const contractType =
      contract.type === "BROKERAGE"
        ? "Zprostředkovatelská smlouva"
        : "Předávací protokol";

    // Send email via Resend
    const emailResult = await sendEmail({
      from: RESEND_FROM_CONTRACTS,
      to: contract.sellerEmail,
      subject: `${contractType} - ${vehicleName} | Carmakler`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F97316;">Carmakler</h2>
          <p>Dobrý den,</p>
          <p>v příloze zasíláme ${contractType.toLowerCase()} pro ${vehicleName}.</p>
          <p>Smlouvu zprostředkoval makléř <strong>${brokerName}</strong>.</p>
          <br/>
          <p>S pozdravem,<br/>Tým Carmakler</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">Tato zpráva byla odeslána automaticky ze systému Carmakler.</p>
        </div>
      `,
      attachments: [
        {
          filename: `smlouva-${contract.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (!emailResult.success) {
      console.error("Contract email failed:", emailResult.error);
      // Pokracovat — smlouva je ulozena, email se muze odeslat manualne
    }

    // Update contract status
    await prisma.contract.update({
      where: { id },
      data: { status: "SENT" },
    });

    return NextResponse.json({ message: "Email odeslán" });
  } catch (error) {
    console.error("POST /api/contracts/[id]/send error:", error);
    return NextResponse.json(
      { error: "Chyba při odesílání emailu" },
      { status: 500 }
    );
  }
}

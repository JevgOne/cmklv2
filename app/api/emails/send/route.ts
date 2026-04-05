import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailSchema } from "@/lib/validators/email";
import { generateEmail } from "@/lib/email-templates";
import type { BrokerSignatureData } from "@/lib/email-templates";
import { sendEmail } from "@/lib/resend";

/* ------------------------------------------------------------------ */
/*  POST /api/emails/send — Odeslání emailu z PWA                     */
/* ------------------------------------------------------------------ */

const DAILY_LIMIT = 50;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Pristup odepren" }, { status: 401 });
    }

    // Only BROKER, MANAGER, ADMIN can send
    if (!["BROKER", "MANAGER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Nedostatecna opravneni" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = sendEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatna data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { templateType, recipientEmail, recipientName, vehicleId, customText, attachmentUrl, variables } =
      parsed.data;

    // Rate limiting: max 50 emails per day per sender
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const sentToday = await prisma.emailLog.count({
      where: {
        senderId: session.user.id,
        createdAt: { gte: todayStart },
      },
    });

    if (sentToday >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: `Dosazili jste denniho limitu ${DAILY_LIMIT} emailu` },
        { status: 429 }
      );
    }

    // Load broker info for signature
    const broker = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        slug: true,
        avatar: true,
      },
    });

    if (!broker) {
      return NextResponse.json({ error: "Uzivatel nenalezen" }, { status: 404 });
    }

    // Load vehicle info if provided
    let vehicleName: string | undefined;
    let vehicleYear: number | undefined;
    let vin: string | undefined;
    let price: number | undefined;

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { brand: true, model: true, variant: true, year: true, vin: true, price: true },
      });
      if (vehicle) {
        vehicleName = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ` ${vehicle.variant}` : ""}`;
        vehicleYear = vehicle.year;
        vin = vehicle.vin;
        price = vehicle.price;
      }
    }

    const brokerData: BrokerSignatureData = {
      firstName: broker.firstName,
      lastName: broker.lastName,
      email: broker.email,
      phone: broker.phone ?? undefined,
      slug: broker.slug ?? undefined,
      avatar: broker.avatar,
    };

    // Generate email content
    const email = generateEmail(templateType, brokerData, {
      recipientName,
      vehicleName,
      vehicleYear,
      vin,
      price: variables?.price ?? price,
      newPrice: variables?.newPrice,
      salePrice: variables?.salePrice,
      monthlyPayment: variables?.monthlyPayment,
      reason: variables?.reason,
      customText,
    });

    // Send via Resend
    const result = await sendEmail({
      to: recipientEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: attachmentUrl
        ? [{ path: attachmentUrl, filename: "smlouva.pdf" }]
        : undefined,
    });

    if (!result.success) {
      await prisma.emailLog.create({
        data: {
          templateType,
          senderId: session.user.id,
          vehicleId: vehicleId || null,
          recipientEmail,
          recipientName,
          subject: email.subject,
          customText,
          status: "FAILED",
        },
      });
      return NextResponse.json({ error: "Chyba pri odesilani emailu" }, { status: 500 });
    }
    const resendId = result.id;

    // Log success
    const log = await prisma.emailLog.create({
      data: {
        templateType,
        senderId: session.user.id,
        vehicleId: vehicleId || null,
        recipientEmail,
        recipientName,
        subject: email.subject,
        customText,
        status: "SENT",
        resendId,
      },
    });

    return NextResponse.json({
      message: `Email odeslan na ${recipientEmail}`,
      emailLogId: log.id,
    });
  } catch (error) {
    console.error("POST /api/emails/send error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

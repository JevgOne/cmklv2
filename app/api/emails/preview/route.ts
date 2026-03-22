import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { previewEmailSchema } from "@/lib/validators/email";
import { generateEmail } from "@/lib/email-templates";
import type { BrokerSignatureData } from "@/lib/email-templates";

/* ------------------------------------------------------------------ */
/*  GET /api/emails/preview — Preview šablony s daty                   */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Pristup odepren" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const rawVariables: Record<string, unknown> = {};
    const priceParam = searchParams.get("price");
    const newPriceParam = searchParams.get("newPrice");
    const monthlyParam = searchParams.get("monthlyPayment");
    const salePriceParam = searchParams.get("salePrice");
    if (priceParam) rawVariables.price = Number(priceParam);
    if (newPriceParam) rawVariables.newPrice = Number(newPriceParam);
    if (monthlyParam) rawVariables.monthlyPayment = Number(monthlyParam);
    if (salePriceParam) rawVariables.salePrice = Number(salePriceParam);
    const reasonParam = searchParams.get("reason");
    if (reasonParam) rawVariables.reason = reasonParam;

    const input = {
      templateType: searchParams.get("templateType") || "",
      recipientName: searchParams.get("recipientName") || undefined,
      vehicleId: searchParams.get("vehicleId") || undefined,
      customText: searchParams.get("customText") || undefined,
      variables: Object.keys(rawVariables).length > 0 ? rawVariables : undefined,
    };

    const parsed = previewEmailSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatne parametry", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { templateType, recipientName, vehicleId, customText, variables } = parsed.data;

    // Load broker data
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

    // Load vehicle if provided
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

    const email = generateEmail(templateType, brokerData, {
      recipientName: recipientName || "Jan Novak",
      vehicleName: vehicleName || "Skoda Octavia Combi",
      vehicleYear: vehicleYear || 2020,
      vin: vin || "TMBJG7NE1L0000000",
      price: variables?.price ?? price ?? 450000,
      newPrice: variables?.newPrice ?? 399000,
      salePrice: variables?.salePrice ?? 430000,
      monthlyPayment: variables?.monthlyPayment ?? 8500,
      reason: variables?.reason ?? "Nizsi poptavka v danem segmentu",
      customText,
    });

    return NextResponse.json({
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (error) {
    console.error("GET /api/emails/preview error:", error);
    return NextResponse.json({ error: "Chyba serveru" }, { status: 500 });
  }
}

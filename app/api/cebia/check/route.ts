import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { orderCebiaReport } from "@/lib/cebia";

/* ------------------------------------------------------------------ */
/*  POST /api/cebia/check — Objednat CEBIA report                     */
/* ------------------------------------------------------------------ */

const CEBIA_PRICE = 49900; // 499 Kč v haléřích

const checkSchema = z.object({
  vin: z.string().min(11).max(17),
  listingId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nepřihlášený" }, { status: 401 });
    }

    const body = await request.json();
    const data = checkSchema.parse(body);

    // Zjistit roli uživatele — makléři mají zdarma
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isBroker = user?.role === "BROKER" || user?.role === "MANAGER";

    if (isBroker) {
      // Makléř — objednat přímo, zdarma
      const result = await orderCebiaReport(data.vin);

      const report = await prisma.cebiaReport.create({
        data: {
          vin: data.vin,
          listingId: data.listingId ?? null,
          orderedById: session.user.id,
          status: result.status === "ERROR" ? "FAILED" : "COMPLETED",
          reportUrl: result.reportUrl ?? null,
          price: 0, // Zdarma pro makléře
        },
      });

      return NextResponse.json({ report, result }, { status: 201 });
    }

    // Ostatní uživatelé — platba přes Stripe
    const report = await prisma.cebiaReport.create({
      data: {
        vin: data.vin,
        listingId: data.listingId ?? null,
        orderedById: session.user.id,
        status: "PENDING",
        price: 499,
      },
    });

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "czk",
            product_data: {
              name: "CEBIA ověření vozidla",
              description: `VIN: ${data.vin}`,
            },
            unit_amount: CEBIA_PRICE,
          },
          quantity: 1,
        },
      ],
      metadata: {
        cebiaReportId: report.id,
        vin: data.vin,
      },
      success_url: `${process.env.NEXTAUTH_URL}/cebia/${report.id}?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/cebia?cancelled=true`,
    });

    return NextResponse.json({
      report,
      checkoutUrl: checkoutSession.url,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neplatná data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/cebia/check error:", error);
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500 }
    );
  }
}

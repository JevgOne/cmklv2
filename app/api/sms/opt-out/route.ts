import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const optOutSchema = z.object({
  phone: z
    .string()
    .min(1, "Telefonni cislo je povinne")
    .regex(/^\+?[0-9]{9,15}$/, "Neplatne telefonni cislo")
    .optional(),
  token: z.string().min(1, "Token je povinny").optional(),
}).refine(
  (data) => data.phone || data.token,
  { message: "Telefon nebo token je povinny" }
);

/**
 * POST /api/sms/opt-out
 * Zpracuje SMS opt-out pro prodejce
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = optOutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatna data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { phone, token } = parsed.data;

    if (token) {
      // Opt-out podle tokenu
      const seller = await prisma.sellerContact.findUnique({
        where: { notificationToken: token },
      });

      if (!seller) {
        return NextResponse.json(
          { error: "Neplatny token" },
          { status: 404 }
        );
      }

      await prisma.sellerContact.update({
        where: { id: seller.id },
        data: { smsOptOut: true },
      });

      return NextResponse.json({
        message: "SMS notifikace byly uspesne odhlaseny",
      });
    }

    if (phone) {
      // Opt-out podle telefonu — odhlasit vsechny prodejce s timto cislem
      const result = await prisma.sellerContact.updateMany({
        where: { phone },
        data: { smsOptOut: true },
      });

      if (result.count === 0) {
        return NextResponse.json(
          { error: "Telefonni cislo nebylo nalezeno" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: "SMS notifikace byly uspesne odhlaseny",
        affected: result.count,
      });
    }

    return NextResponse.json(
      { error: "Telefon nebo token je povinny" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Chyba pri zpracovani SMS opt-out:", error);
    return NextResponse.json(
      { error: "Chyba serveru" },
      { status: 500 }
    );
  }
}

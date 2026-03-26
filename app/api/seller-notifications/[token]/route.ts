import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getSellerPreferences,
  updateSellerPreference,
} from "@/lib/seller-notifications";
import {
  SELLER_EVENT_TYPES,
  sellerNotificationPreferenceSchema,
} from "@/lib/validators/notifications";

/**
 * GET /api/seller-notifications/[token]
 * Nacte notifikacni preference prodejce podle tokenu (bez auth — token je autorizace)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const seller = await getSellerPreferences(token);

    if (!seller) {
      return NextResponse.json(
        { error: "Neplatny token" },
        { status: 404 }
      );
    }

    // Doplnit defaulty pro chybejici event typy
    const prefsMap = new Map(
      seller.notificationPreferences.map((p) => [p.eventType, p])
    );

    const preferences = SELLER_EVENT_TYPES.map((eventType) => {
      const existing = prefsMap.get(eventType);
      return {
        eventType,
        smsEnabled: existing?.smsEnabled ?? true,
        emailEnabled: existing?.emailEnabled ?? true,
      };
    });

    return NextResponse.json({
      name: seller.name,
      smsOptOut: seller.smsOptOut,
      emailOptOut: seller.emailOptOut,
      preferences,
    });
  } catch (error) {
    console.error("Chyba pri nacitani seller preferenci:", error);
    return NextResponse.json(
      { error: "Chyba serveru" },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  preferences: z.array(sellerNotificationPreferenceSchema).min(1),
});

/**
 * PUT /api/seller-notifications/[token]
 * Aktualizuje notifikacni preference prodejce
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Ověřit, že token existuje
    const seller = await getSellerPreferences(token);
    if (!seller) {
      return NextResponse.json(
        { error: "Neplatny token" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatna data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      parsed.data.preferences.flatMap((pref) => [
        updateSellerPreference(token, pref.eventType, "smsEnabled", pref.smsEnabled),
        updateSellerPreference(token, pref.eventType, "emailEnabled", pref.emailEnabled),
      ])
    );

    return NextResponse.json({
      message: "Preference ulozeny",
      updated: results.filter(Boolean).length / 2,
    });
  } catch (error) {
    console.error("Chyba pri ukladani seller preferenci:", error);
    return NextResponse.json(
      { error: "Chyba serveru" },
      { status: 500 }
    );
  }
}

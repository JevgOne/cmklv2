import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  updateNotificationPreferencesSchema,
  NOTIFICATION_EVENT_TYPES,
} from "@/lib/validators/notifications";

/**
 * GET /api/settings/notifications
 * Vraci notifikacni preference aktualniho uzivatele
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neprihlasen" }, { status: 401 });
    }

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId: session.user.id },
    });

    // Doplnit defaulty pro chybejici event typy
    const prefsMap = new Map(
      preferences.map((p) => [p.eventType, p])
    );

    const fullPreferences = NOTIFICATION_EVENT_TYPES.map((eventType) => {
      const existing = prefsMap.get(eventType);
      return {
        eventType,
        pushEnabled: existing?.pushEnabled ?? true,
        emailEnabled: existing?.emailEnabled ?? true,
        smsEnabled: existing?.smsEnabled ?? false,
      };
    });

    return NextResponse.json({ preferences: fullPreferences });
  } catch (error) {
    console.error("Chyba pri nacitani notifikacnich preferenci:", error);
    return NextResponse.json(
      { error: "Chyba serveru" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/notifications
 * Aktualizuje notifikacni preference
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Neprihlasen" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateNotificationPreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neplatna data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Upsert kazdy preference
    const results = await Promise.all(
      parsed.data.preferences.map((pref) =>
        prisma.notificationPreference.upsert({
          where: {
            userId_eventType: { userId, eventType: pref.eventType },
          },
          update: {
            pushEnabled: pref.pushEnabled,
            emailEnabled: pref.emailEnabled,
            smsEnabled: pref.smsEnabled,
          },
          create: {
            userId,
            eventType: pref.eventType,
            pushEnabled: pref.pushEnabled,
            emailEnabled: pref.emailEnabled,
            smsEnabled: pref.smsEnabled,
          },
        })
      )
    );

    return NextResponse.json({
      message: "Preference ulozeny",
      preferences: results.map((r) => ({
        eventType: r.eventType,
        pushEnabled: r.pushEnabled,
        emailEnabled: r.emailEnabled,
        smsEnabled: r.smsEnabled,
      })),
    });
  } catch (error) {
    console.error("Chyba pri ukladani notifikacnich preferenci:", error);
    return NextResponse.json(
      { error: "Chyba serveru" },
      { status: 500 }
    );
  }
}

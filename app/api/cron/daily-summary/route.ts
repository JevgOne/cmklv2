import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/cron/daily-summary
 * Vercel Cron — 7:00 rano, generuje denni shrnuti pro kazdeho maklere
 * Overeni pres CRON_SECRET header
 */
export async function POST(request: NextRequest) {
  try {
    // Overeni cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Neopravneny pristup" }, { status: 401 });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Najit vsechny aktivni maklere
    const brokers = await prisma.user.findMany({
      where: {
        role: { in: ["BROKER", "MANAGER"] },
        status: "ACTIVE",
      },
      select: { id: true, firstName: true },
    });

    let processed = 0;

    for (const broker of brokers) {
      // Overit, zda ma makler povolene denni shrnuti
      const pref = await prisma.notificationPreference.findUnique({
        where: {
          userId_eventType: {
            userId: broker.id,
            eventType: "DAILY_SUMMARY",
          },
        },
      });

      // Pokud explicitne vypnul push, preskocit
      if (pref && !pref.pushEnabled && !pref.emailEnabled) {
        continue;
      }

      // Statistiky za vcera
      const [viewCount, inquiryCount, leadCount, vehicleCount] = await Promise.all([
        // Celkovy pocet zobrazeni maklerovych aut
        prisma.vehicle
          .aggregate({
            where: {
              brokerId: broker.id,
              status: "ACTIVE",
            },
            _sum: { viewCount: true },
          })
          .then((r) => r._sum.viewCount ?? 0),

        // Nove dotazy za vcera
        prisma.vehicleInquiry.count({
          where: {
            brokerId: broker.id,
            createdAt: { gte: yesterday, lt: today },
          },
        }),

        // Nove leady za vcera
        prisma.lead.count({
          where: {
            assignedToId: broker.id,
            createdAt: { gte: yesterday, lt: today },
          },
        }),

        // Pocet aktivnich aut
        prisma.vehicle.count({
          where: {
            brokerId: broker.id,
            status: "ACTIVE",
          },
        }),
      ]);

      // Vytvorit push notifikaci
      if (!pref || pref.pushEnabled) {
        await createNotification({
          userId: broker.id,
          type: "SYSTEM",
          title: "Denni shrnuti",
          body: `Vcera: ${viewCount} zobrazeni, ${inquiryCount} dotazu, ${leadCount} leadu. Mate ${vehicleCount} aktivnich aut.`,
          link: "/makler/dashboard",
        });
      }

      processed++;
    }

    return NextResponse.json({
      message: `Denni shrnuti vygenerovano pro ${processed} makleru`,
      processed,
      total: brokers.length,
    });
  } catch (error) {
    console.error("Chyba pri generovani denniho shrnuti:", error);
    return NextResponse.json(
      { error: "Chyba serveru" },
      { status: 500 }
    );
  }
}

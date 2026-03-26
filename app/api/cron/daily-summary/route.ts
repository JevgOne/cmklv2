import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import {
  dailySummaryHtml,
  dailySummaryText,
  dailySummarySubject,
} from "@/lib/email-templates/daily-summary";
import type {
  DailySummaryData,
  TopVehicle,
  InquiryItem,
  PendingLead,
  StalingVehicle,
} from "@/lib/email-templates/daily-summary";

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

    const dateStr = yesterday.toLocaleDateString("cs-CZ");

    // Najit vsechny aktivni maklere
    const brokers = await prisma.user.findMany({
      where: {
        role: { in: ["BROKER", "MANAGER"] },
        status: "ACTIVE",
      },
      select: { id: true, firstName: true, email: true },
    });

    let processed = 0;
    let emailsSent = 0;

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

      // Pokud explicitne vypnul oba kanaly, preskocit
      if (pref && !pref.pushEnabled && !pref.emailEnabled) {
        continue;
      }

      // Statistiky za vcera
      const [viewCount, inquiryCount, leadCount, vehicleCount] = await Promise.all([
        prisma.vehicle
          .aggregate({
            where: {
              brokerId: broker.id,
              status: "ACTIVE",
            },
            _sum: { viewCount: true },
          })
          .then((r) => r._sum.viewCount ?? 0),

        prisma.vehicleInquiry.count({
          where: {
            brokerId: broker.id,
            createdAt: { gte: yesterday, lt: today },
          },
        }),

        prisma.lead.count({
          where: {
            assignedToId: broker.id,
            createdAt: { gte: yesterday, lt: today },
          },
        }),

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

      // Odeslat email shrnuti
      if (!pref || pref.emailEnabled) {
        // TOP 3 nejprohlizenejsi auta
        const topVehiclesRaw = await prisma.vehicle.findMany({
          where: {
            brokerId: broker.id,
            status: "ACTIVE",
          },
          orderBy: { viewCount: "desc" },
          take: 3,
          select: {
            brand: true,
            model: true,
            year: true,
            viewCount: true,
            price: true,
            id: true,
          },
        });

        const topVehicleIds = topVehiclesRaw.map((v) => v.id);

        // Pocet dotazu na TOP 3 auta
        const inquiryCounts = topVehicleIds.length > 0
          ? await prisma.vehicleInquiry.groupBy({
              by: ["vehicleId"],
              where: { vehicleId: { in: topVehicleIds } },
              _count: true,
            })
          : [];

        const inquiryCountMap = new Map(
          inquiryCounts.map((ic) => [ic.vehicleId, ic._count])
        );

        const topVehicles: TopVehicle[] = topVehiclesRaw.map((v) => ({
          name: `${v.brand} ${v.model} ${v.year}`,
          views: v.viewCount ?? 0,
          inquiries: inquiryCountMap.get(v.id) ?? 0,
          price: v.price ?? 0,
        }));

        // Nove dotazy za vcera
        const newInquiriesRaw = await prisma.vehicleInquiry.findMany({
          where: {
            brokerId: broker.id,
            createdAt: { gte: yesterday, lt: today },
          },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            vehicle: { select: { brand: true, model: true, year: true } },
            buyerName: true,
            buyerPhone: true,
            createdAt: true,
          },
        });

        const newInquiries: InquiryItem[] = newInquiriesRaw.map((inq) => ({
          vehicleName: `${inq.vehicle.brand} ${inq.vehicle.model} ${inq.vehicle.year}`,
          buyerName: inq.buyerName,
          buyerPhone: inq.buyerPhone ?? undefined,
          createdAt: inq.createdAt.toLocaleDateString("cs-CZ"),
        }));

        // Cekajici leady (NEW status)
        const pendingLeadsRaw = await prisma.lead.findMany({
          where: {
            assignedToId: broker.id,
            status: "NEW",
          },
          take: 5,
          orderBy: { createdAt: "asc" },
          select: {
            name: true,
            brand: true,
            model: true,
            createdAt: true,
          },
        });

        const pendingLeads: PendingLead[] = pendingLeadsRaw.map((lead) => ({
          vehicleName: [lead.brand, lead.model].filter(Boolean).join(" ") || "Neuvedeno",
          sellerName: lead.name,
          daysOld: Math.floor(
            (today.getTime() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
        }));

        // Auta blizici se 30 dnum
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 25);

        const stalingVehiclesRaw = await prisma.vehicle.findMany({
          where: {
            brokerId: broker.id,
            status: "ACTIVE",
            createdAt: { lte: thirtyDaysAgo },
          },
          take: 5,
          orderBy: { createdAt: "asc" },
          select: {
            brand: true,
            model: true,
            year: true,
            viewCount: true,
            createdAt: true,
          },
        });

        const stalingVehicles: StalingVehicle[] = stalingVehiclesRaw.map((v) => ({
          name: `${v.brand} ${v.model} ${v.year}`,
          daysActive: Math.floor(
            (today.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
          views: v.viewCount ?? 0,
        }));

        const summaryData: DailySummaryData = {
          brokerName: broker.firstName,
          date: dateStr,
          views: viewCount,
          inquiries: inquiryCount,
          leads: leadCount,
          topVehicles,
          newInquiries,
          pendingLeads,
          stalingVehicles,
        };

        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);

          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "info@carmakler.cz",
            to: broker.email,
            subject: dailySummarySubject(summaryData),
            html: dailySummaryHtml(summaryData),
            text: dailySummaryText(summaryData),
          });

          emailsSent++;
        } catch (emailError) {
          console.error(`Chyba pri odesilani emailu makleri ${broker.id}:`, emailError);
        }
      }

      processed++;
    }

    return NextResponse.json({
      message: `Denni shrnuti vygenerovano pro ${processed} makleru`,
      processed,
      emailsSent,
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

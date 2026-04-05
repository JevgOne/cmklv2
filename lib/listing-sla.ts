import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import {
  watchdogMatchSubject,
  watchdogMatchHtml,
  watchdogMatchText,
  type WatchdogMatchData,
} from "@/lib/email-templates/listing/watchdog-match";

// ============================================
// SLA kontrolní logika pro inzerátní platformu
// ============================================

/**
 * SLA kontrola — 48h reminder na nepřečtené dotazy, 7d deaktivace
 */
export async function checkInquirySla(): Promise<{
  reminders: number;
  deactivated: number;
}> {
  const now = new Date();
  const hours48ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const days7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Najít inzeráty s nepřečtenými dotazy staršími 48h (pro reminder)
  const listingsForReminder = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      inquiries: {
        some: {
          status: "NEW",
          createdAt: { lt: hours48ago },
        },
      },
      responseDeadline: null, // Ještě nebyl poslán reminder
    },
    select: { id: true, userId: true },
  });

  // Nastavit responseDeadline na 7 dní
  for (const listing of listingsForReminder) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        responseDeadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 dní (celkem 7 od dotazu)
      },
    });
  }

  // 2. Deaktivovat inzeráty s prošlým deadline
  const listingsToDeactivate = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      responseDeadline: { lt: now },
      inquiries: {
        some: {
          status: "NEW",
        },
      },
    },
    select: { id: true },
  });

  for (const listing of listingsToDeactivate) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { status: "INACTIVE" },
    });
  }

  return {
    reminders: listingsForReminder.length,
    deactivated: listingsToDeactivate.length,
  };
}

/**
 * Expirace inzerátů po 60 dnech
 */
export async function checkListingExpiry(): Promise<number> {
  const days60ago = new Date();
  days60ago.setDate(days60ago.getDate() - 60);

  const result = await prisma.listing.updateMany({
    where: {
      status: "ACTIVE",
      OR: [
        { expiresAt: { lt: new Date() } },
        { expiresAt: null, publishedAt: { lt: days60ago } },
      ],
    },
    data: { status: "EXPIRED" },
  });

  return result.count;
}

/**
 * Upsell kandidáti — inzeráty staré 14/30/45 dní
 */
export async function checkUpsellCandidates(): Promise<{
  stage1: number;
  stage2: number;
  stage3: number;
}> {
  const now = new Date();
  const days14ago = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const days30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const days45ago = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);

  // Stage 1: 14 dní — nabídnout TOP
  const stage1 = await prisma.listing.updateMany({
    where: {
      status: "ACTIVE",
      upsellStage: 0,
      isPremium: false,
      publishedAt: { lt: days14ago },
    },
    data: { upsellStage: 1, upsellSentAt: now },
  });

  // Stage 2: 30 dní — nabídnout slevu na TOP
  const stage2 = await prisma.listing.updateMany({
    where: {
      status: "ACTIVE",
      upsellStage: 1,
      isPremium: false,
      publishedAt: { lt: days30ago },
    },
    data: { upsellStage: 2, upsellSentAt: now },
  });

  // Stage 3: 45 dní — nabídnout prodloužení nebo makléře
  const stage3 = await prisma.listing.updateMany({
    where: {
      status: "ACTIVE",
      upsellStage: 2,
      isPremium: false,
      publishedAt: { lt: days45ago },
    },
    data: { upsellStage: 3, upsellSentAt: now },
  });

  return {
    stage1: stage1.count,
    stage2: stage2.count,
    stage3: stage3.count,
  };
}

/**
 * Expirace rezervací po 48h
 */
export async function checkReservationExpiry(): Promise<number> {
  const result = await prisma.reservation.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  return result.count;
}

const WATCHDOG_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.carmakler.cz";

async function sendWatchdogEmail(
  recipientEmail: string,
  watchdog: { id: string; brand?: string | null; model?: string | null; city?: string | null },
  listings: Array<{
    id: string;
    brand: string;
    model: string;
    price: number;
    year: number | null;
    mileage: number | null;
    slug: string | null;
    images: { url: string }[];
  }>
) {
  // Sestavit lidsky citelny popis kriterii
  const criteriaParts: string[] = [];
  if (watchdog.brand) criteriaParts.push(watchdog.brand);
  if (watchdog.model) criteriaParts.push(watchdog.model);
  if (watchdog.city) criteriaParts.push(watchdog.city);
  const criteria = criteriaParts.length > 0 ? criteriaParts.join(", ") : "Vsechna vozidla";

  const data: WatchdogMatchData = {
    userName: recipientEmail.split("@")[0], // fallback pokud nemame jmeno
    criteria,
    matches: listings.map((l) => ({
      title: `${l.brand} ${l.model}`,
      price: `${l.price.toLocaleString("cs-CZ")} Kc`,
      year: l.year || 0,
      mileage: l.mileage ? `${l.mileage.toLocaleString("cs-CZ")} km` : "neuvedeno",
      imageUrl: l.images[0]?.url,
      listingUrl: `${WATCHDOG_BASE_URL}/nabidka/${l.slug || l.id}`,
    })),
    manageUrl: `${WATCHDOG_BASE_URL}/muj-ucet/watchdogy`,
  };

  await sendEmail({
    to: recipientEmail,
    subject: watchdogMatchSubject(data),
    html: watchdogMatchHtml(data),
    text: watchdogMatchText(data),
  });
}

/**
 * Watchdog matching — najít nové inzeráty odpovídající hlídacím psům
 */
export async function matchWatchdogs(): Promise<number> {
  const watchdogs = await prisma.watchdog.findMany({
    where: { active: true },
    include: { user: { select: { email: true } } },
  });

  let matched = 0;

  for (const watchdog of watchdogs) {
    const since = watchdog.lastNotified || watchdog.createdAt;

    const where: Record<string, unknown> = {
      status: "ACTIVE",
      publishedAt: { gt: since },
    };

    if (watchdog.brand) where.brand = watchdog.brand;
    if (watchdog.model) where.model = watchdog.model;
    if (watchdog.fuelType) where.fuelType = watchdog.fuelType;
    if (watchdog.bodyType) where.bodyType = watchdog.bodyType;
    if (watchdog.city) where.city = watchdog.city;

    if (watchdog.minPrice || watchdog.maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (watchdog.minPrice) priceFilter.gte = watchdog.minPrice;
      if (watchdog.maxPrice) priceFilter.lte = watchdog.maxPrice;
      where.price = priceFilter;
    }

    if (watchdog.minYear || watchdog.maxYear) {
      const yearFilter: Record<string, number> = {};
      if (watchdog.minYear) yearFilter.gte = watchdog.minYear;
      if (watchdog.maxYear) yearFilter.lte = watchdog.maxYear;
      where.year = yearFilter;
    }

    const newListings = await prisma.listing.findMany({
      where,
      select: {
        id: true,
        brand: true,
        model: true,
        price: true,
        year: true,
        mileage: true,
        slug: true,
        images: { take: 1, select: { url: true } },
      },
      take: 10,
    });

    if (newListings.length > 0) {
      matched++;

      // Aktualizovat lastNotified
      await prisma.watchdog.update({
        where: { id: watchdog.id },
        data: { lastNotified: new Date() },
      });

      // Odeslat email notifikaci
      const recipientEmail = watchdog.email || watchdog.user?.email;
      if (recipientEmail) {
        try {
          await sendWatchdogEmail(recipientEmail, watchdog, newListings);
        } catch (emailError) {
          console.error(`Watchdog email failed for ${watchdog.id}:`, emailError);
          // Nepropagovat chybu — watchdog match se zapise, email se zkusi znovu priste
        }
      }
    }
  }

  return matched;
}

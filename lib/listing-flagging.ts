import { prisma } from "@/lib/prisma";

// ============================================
// Auto-flagování inzerátů
// ============================================

export interface FlagResult {
  flagged: boolean;
  reasons: string[];
  moderationStatus: string;
}

/**
 * Automatické flagování inzerátu při vytvoření.
 * Kontroluje:
 * 1. Cena < 50% průměru pro danou značku/model
 * 2. Duplicitní VIN
 * 3. Méně než 3 fotky
 */
export async function autoFlagListing(listingId: string): Promise<FlagResult> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { images: true },
  });

  if (!listing) {
    return { flagged: false, reasons: [], moderationStatus: "AUTO_APPROVED" };
  }

  const reasons: string[] = [];

  // 1. Kontrola ceny — < 50% průměru pro značku+model
  const avgResult = await prisma.listing.aggregate({
    where: {
      brand: listing.brand,
      model: listing.model,
      status: "ACTIVE",
      id: { not: listing.id },
    },
    _avg: { price: true },
  });

  if (avgResult._avg.price && listing.price < avgResult._avg.price * 0.5) {
    reasons.push("PRICE_TOO_LOW");
  }

  // 2. Kontrola duplicitního VIN
  if (listing.vin) {
    const duplicateVin = await prisma.listing.findFirst({
      where: {
        vin: listing.vin,
        id: { not: listing.id },
        status: { in: ["ACTIVE", "DRAFT"] },
      },
    });

    if (duplicateVin) {
      reasons.push("DUPLICATE_VIN");
    }
  }

  // 3. Kontrola počtu fotek
  if (listing.images.length < 3) {
    reasons.push("FEW_PHOTOS");
  }

  const flagged = reasons.length > 0;
  const moderationStatus = flagged ? "PENDING_REVIEW" : "AUTO_APPROVED";

  // Aktualizovat listing
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      flagged,
      flagReasons: flagged ? JSON.stringify(reasons) : null,
      flaggedAt: flagged ? new Date() : null,
      moderationStatus,
    },
  });

  return { flagged, reasons, moderationStatus };
}

/**
 * Manuální nahlášení inzerátu kupujícím.
 */
export async function flagListingManually(
  listingId: string,
  reason: string
): Promise<void> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { flagReasons: true },
  });

  if (!listing) return;

  const existingReasons: string[] = listing.flagReasons
    ? JSON.parse(listing.flagReasons)
    : [];

  existingReasons.push(`USER_REPORT: ${reason}`);

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      flagged: true,
      flagReasons: JSON.stringify(existingReasons),
      flaggedAt: new Date(),
      moderationStatus: "PENDING_REVIEW",
    },
  });
}

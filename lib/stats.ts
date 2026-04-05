import { prisma } from "@/lib/prisma";

/**
 * Fallback defaults — pouziji se pokud DB je prazdna nebo nedostupna.
 * Zobrazuji se jako "–" v UI (ne nuly, ne fiktivni cisla).
 */
const DEFAULTS = {
  soldVehicles: 0,
  avgSaleDays: 0,
  avgRating: 0,
  completedFlips: 0,
  avgROI: 0,
  avgFlipDays: 0,
};

/**
 * Statistiky pro stranku /chci-prodat
 */
export async function getBrokerStats() {
  try {
    // 1) Pocet prodanych vozidel (Vehicle.status === "SOLD")
    const soldVehicles = await prisma.vehicle.count({
      where: { status: "SOLD" },
    });

    // 2) Prumerna doba prodeje (createdAt -> updatedAt pro SOLD vozidla)
    //    Vehicle nema explicitni soldAt pole, pouzijeme updatedAt
    const recentSold = await prisma.vehicle.findMany({
      where: { status: "SOLD" },
      select: { createdAt: true, updatedAt: true },
      take: 100,
      orderBy: { updatedAt: "desc" },
    });

    let avgSaleDays = DEFAULTS.avgSaleDays;
    if (recentSold.length > 0) {
      const totalDays = recentSold.reduce((sum, v) => {
        const days = Math.ceil(
          (v.updatedAt.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + Math.max(days, 1); // min 1 den
      }, 0);
      avgSaleDays = Math.round(totalDays / recentSold.length);
    }

    // 3) Prumerne hodnoceni vozidel (Vehicle.overallRating — Int? 1-5)
    const ratingResult = await prisma.vehicle.aggregate({
      where: {
        overallRating: { not: null },
      },
      _avg: { overallRating: true },
    });
    const avgRating = ratingResult._avg.overallRating
      ? Math.round(ratingResult._avg.overallRating * 10) / 10
      : DEFAULTS.avgRating;

    return {
      soldVehicles: soldVehicles || DEFAULTS.soldVehicles,
      avgSaleDays: avgSaleDays || DEFAULTS.avgSaleDays,
      avgRating: avgRating || DEFAULTS.avgRating,
    };
  } catch (error) {
    console.error("Failed to load broker stats:", error);
    return DEFAULTS;
  }
}

/**
 * Statistiky pro stranku /marketplace
 */
export async function getMarketplaceStats() {
  try {
    // 1) Pocet dokoncenych flipu (FlipOpportunity.status === "COMPLETED")
    const completedFlips = await prisma.flipOpportunity.count({
      where: { status: "COMPLETED" },
    });

    // 2) Prumerny ROI a doba flipu
    const completedDeals = await prisma.flipOpportunity.findMany({
      where: { status: "COMPLETED" },
      select: {
        purchasePrice: true,
        repairCost: true,
        actualSalePrice: true,
        soldAt: true,
        createdAt: true,
      },
      take: 50,
      orderBy: { soldAt: "desc" },
    });

    let avgROI = DEFAULTS.avgROI;
    let avgFlipDays = DEFAULTS.avgFlipDays;

    if (completedDeals.length > 0) {
      let roiCount = 0;
      let daysCount = 0;
      let totalROI = 0;
      let totalDays = 0;

      for (const d of completedDeals) {
        // ROI: (prodejni - nakupni - opravy) / (nakupni + opravy) * 100
        if (d.actualSalePrice && d.purchasePrice) {
          const investment = d.purchasePrice + (d.repairCost || 0);
          const profit = d.actualSalePrice - investment;
          totalROI += (profit / investment) * 100;
          roiCount++;
        }
        // Doba: createdAt -> soldAt
        if (d.soldAt) {
          const days = Math.ceil(
            (d.soldAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          totalDays += Math.max(days, 1);
          daysCount++;
        }
      }

      if (roiCount > 0) avgROI = Math.round(totalROI / roiCount);
      if (daysCount > 0) avgFlipDays = Math.round(totalDays / daysCount);
    }

    return {
      completedFlips: completedFlips || DEFAULTS.completedFlips,
      avgROI: avgROI || DEFAULTS.avgROI,
      avgFlipDays: avgFlipDays || DEFAULTS.avgFlipDays,
    };
  } catch (error) {
    console.error("Failed to load marketplace stats:", error);
    return DEFAULTS;
  }
}

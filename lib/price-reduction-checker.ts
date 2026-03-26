import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const STALE_THRESHOLD_DAYS = 30;
const MANAGER_THRESHOLD_DAYS = 60;
const BACKOFFICE_THRESHOLD_DAYS = 90;

export async function checkStaleVehicles() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  // Find all ACTIVE vehicles published more than 30 days ago with a broker
  const staleVehicles = await prisma.vehicle.findMany({
    where: {
      status: "ACTIVE",
      publishedAt: { not: null, lte: thirtyDaysAgo },
      brokerId: { not: null },
    },
    select: {
      id: true,
      brand: true,
      model: true,
      price: true,
      publishedAt: true,
      brokerId: true,
      broker: {
        select: {
          id: true,
          managerId: true,
        },
      },
    },
  });

  let processed = 0;

  for (const vehicle of staleVehicles) {
    if (!vehicle.publishedAt || !vehicle.brokerId) continue;

    const daysActive = Math.floor(
      (now.getTime() - vehicle.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const vehicleName = `${vehicle.brand} ${vehicle.model}`;

    // 30+ days: suggest price reduction (if not already suggested)
    const existingReduction = await prisma.priceReduction.findFirst({
      where: { vehicleId: vehicle.id },
    });

    if (!existingReduction) {
      const suggestedPrice = Math.round(vehicle.price * 0.9);

      await prisma.priceReduction.create({
        data: {
          vehicleId: vehicle.id,
          currentPrice: vehicle.price,
          suggestedPrice,
          reason: `Auto je v nabidce pres ${daysActive} dni`,
        },
      });

      await createNotification({
        userId: vehicle.brokerId,
        type: "VEHICLE",
        title: "Doporuceni snizit cenu",
        body: `Auto ${vehicleName} je v nabidce ${daysActive} dni. Doporucujeme snizit cenu.`,
        link: `/makler/vehicles/${vehicle.id}`,
      });
    }

    // 60+ days: notify manager
    if (daysActive >= MANAGER_THRESHOLD_DAYS && vehicle.broker?.managerId) {
      await createNotification({
        userId: vehicle.broker.managerId,
        type: "VEHICLE",
        title: "Vozidlo dlouho neprodano",
        body: `Auto ${vehicleName} (makler) je v nabidce ${daysActive} dni. Zvazit intervenci.`,
        link: `/makler/vehicles/${vehicle.id}`,
      });
    }

    // 90+ days: notify BackOffice
    if (daysActive >= BACKOFFICE_THRESHOLD_DAYS) {
      const backofficeUsers = await prisma.user.findMany({
        where: { role: "BACKOFFICE" },
        select: { id: true },
      });

      for (const boUser of backofficeUsers) {
        await createNotification({
          userId: boUser.id,
          type: "VEHICLE",
          title: "Zvazit deaktivaci vozidla",
          body: `Auto ${vehicleName} je v nabidce ${daysActive} dni. Zvazit deaktivaci.`,
          link: `/admin/vehicles/${vehicle.id}`,
        });
      }
    }

    processed++;
  }

  return { processed, total: staleVehicles.length };
}

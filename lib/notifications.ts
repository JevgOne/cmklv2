import { prisma } from "@/lib/prisma";

interface CreateNotificationParams {
  userId: string;
  type: "COMMISSION" | "VEHICLE" | "SYSTEM" | "MESSAGE";
  title: string;
  body: string;
  link?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      link: link ?? null,
    },
  });
}

export async function createManagerNotification({
  brokerId,
  vehicleId,
  action,
  vehicleName,
  reason,
}: {
  brokerId: string;
  vehicleId: string;
  action: "approved" | "returned" | "rejected";
  vehicleName: string;
  reason?: string;
}) {
  const titleMap = {
    approved: "Vozidlo schváleno",
    returned: "Vozidlo vráceno k dopracování",
    rejected: "Vozidlo zamítnuto",
  };

  const bodyMap = {
    approved: `Vaše vozidlo ${vehicleName} bylo schváleno a zveřejněno.`,
    returned: `Vaše vozidlo ${vehicleName} bylo vráceno k dopracování.${reason ? ` Důvod: ${reason}` : ""}`,
    rejected: `Vaše vozidlo ${vehicleName} bylo zamítnuto.${reason ? ` Důvod: ${reason}` : ""}`,
  };

  return createNotification({
    userId: brokerId,
    type: "VEHICLE",
    title: titleMap[action],
    body: bodyMap[action],
    link: `/makler/vehicles/${vehicleId}`,
  });
}

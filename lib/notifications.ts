import { prisma } from "@/lib/prisma";

interface CreateNotificationParams {
  userId: string;
  type: "COMMISSION" | "VEHICLE" | "SYSTEM" | "MESSAGE";
  title: string;
  body: string;
  link?: string;
}

// Notification type → mobile route mapping
const NOTIFICATION_ROUTE_MAP: Record<string, (id?: string) => string> = {
  VEHICLE: (id) => id ? `/(broker)/vehicles/${id}` : "/(broker)/dashboard",
  LEAD: (id) => id ? `/(broker)/leads/${id}` : "/(broker)/dashboard",
  COMMISSION: () => "/(broker)/dashboard",
  SYSTEM: () => "/(broker)/notifications",
  MESSAGE: (id) => id ? `/(broker)/inbox/${id}` : "/(broker)/inbox",
  WORKFLOW: (id) => id ? `/(admin)/workflow/${id}` : "/(admin)/dashboard",
  ORDER: (id) => id ? `/(parts)/orders/${id}` : "/(parts)/orders",
  DEAL: (id) => id ? `/(marketplace)/deals/${id}` : "/(marketplace)/deals",
};

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: CreateNotificationParams) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      link: link ?? null,
    },
  });

  // Fire-and-forget push notification
  sendPushToUser(userId, title, body, link).catch(() => {});

  return notification;
}

async function sendPushToUser(userId: string, title: string, body: string, link?: string) {
  const tokens = await prisma.pushToken.findMany({
    where: { userId },
    select: { token: true },
  });

  if (tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.token,
    sound: "default" as const,
    title,
    body,
    data: { link: link ?? undefined },
  }));

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(messages),
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

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

/**
 * Generuje unikatni notifikacni token pro prodejce
 */
export function generateNotificationToken(): string {
  return randomUUID();
}

/**
 * Nacte notifikacni preference prodejce podle tokenu
 */
export async function getSellerPreferences(token: string) {
  const seller = await prisma.sellerContact.findUnique({
    where: { notificationToken: token },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      smsOptOut: true,
      emailOptOut: true,
      notificationPreferences: {
        select: {
          eventType: true,
          smsEnabled: true,
          emailEnabled: true,
        },
      },
    },
  });

  return seller;
}

/**
 * Aktualizuje notifikacni preferenci prodejce
 */
export async function updateSellerPreference(
  token: string,
  eventType: string,
  channel: "smsEnabled" | "emailEnabled",
  value: boolean
) {
  const seller = await prisma.sellerContact.findUnique({
    where: { notificationToken: token },
    select: { id: true },
  });

  if (!seller) return null;

  return prisma.sellerNotificationPreference.upsert({
    where: {
      sellerContactId_eventType: {
        sellerContactId: seller.id,
        eventType,
      },
    },
    update: { [channel]: value },
    create: {
      sellerContactId: seller.id,
      eventType,
      smsEnabled: channel === "smsEnabled" ? value : true,
      emailEnabled: channel === "emailEnabled" ? value : true,
    },
  });
}

/**
 * Zkontroluje, zda ma prodejce povolene SMS pro dany typ udalosti
 */
export async function isSellerSmsEnabled(
  sellerContactId: string,
  eventType: string
): Promise<boolean> {
  const seller = await prisma.sellerContact.findUnique({
    where: { id: sellerContactId },
    select: { smsOptOut: true },
  });

  if (seller?.smsOptOut) return false;

  const pref = await prisma.sellerNotificationPreference.findUnique({
    where: {
      sellerContactId_eventType: { sellerContactId, eventType },
    },
  });

  return pref?.smsEnabled ?? true;
}

/**
 * Zkontroluje, zda ma prodejce povolene emaily pro dany typ udalosti
 */
export async function isSellerEmailEnabled(
  sellerContactId: string,
  eventType: string
): Promise<boolean> {
  const seller = await prisma.sellerContact.findUnique({
    where: { id: sellerContactId },
    select: { emailOptOut: true },
  });

  if (seller?.emailOptOut) return false;

  const pref = await prisma.sellerNotificationPreference.findUnique({
    where: {
      sellerContactId_eventType: { sellerContactId, eventType },
    },
  });

  return pref?.emailEnabled ?? true;
}

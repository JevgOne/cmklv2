import { prisma } from "@/lib/prisma";
import type { SmsTemplateType } from "@/lib/validators/notifications";

// ============================================
// SMS WRAPPER — MVP placeholder (console.log)
// Připraveno pro GoSMS.cz / Twilio integraci
// ============================================

const MAX_SMS_PER_DAY = 5;

interface SendSmsParams {
  phone: string;
  message: string;
  vehicleId?: string;
}

interface SendSmsResult {
  success: boolean;
  error?: string;
  smsLogId?: string;
}

/**
 * Odesle SMS (MVP: console.log, produkce: GoSMS/Twilio)
 * Rate limiting: max 5 SMS/den na cislo
 */
export async function sendSms({
  phone,
  message,
  vehicleId,
}: SendSmsParams): Promise<SendSmsResult> {
  // Rate limiting — max 5 SMS/den na číslo
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await prisma.smsLog.count({
    where: {
      recipientPhone: phone,
      createdAt: { gte: todayStart },
      status: { not: "FAILED" },
    },
  });

  if (todayCount >= MAX_SMS_PER_DAY) {
    return {
      success: false,
      error: `Rate limit: max ${MAX_SMS_PER_DAY} SMS/den na cislo ${phone}`,
    };
  }

  try {
    // MVP: Console log misto skutecneho odeslani
    // TODO: Nahradit GoSMS.cz nebo Twilio integracni
    console.log(`[SMS] To: ${phone} | Message: ${message}`);

    // Zalogovat do DB
    const smsLog = await prisma.smsLog.create({
      data: {
        recipientPhone: phone,
        message,
        vehicleId: vehicleId ?? null,
        status: "SENT",
        cost: null, // Doplnit po napojeni na provider
      },
    });

    return { success: true, smsLogId: smsLog.id };
  } catch (error) {
    console.error("[SMS] Chyba pri odesilani:", error);

    // Zalogovat neuspech
    await prisma.smsLog.create({
      data: {
        recipientPhone: phone,
        message,
        vehicleId: vehicleId ?? null,
        status: "FAILED",
      },
    });

    return {
      success: false,
      error: "Chyba pri odesilani SMS",
    };
  }
}

// ============================================
// SMS SABLONY
// ============================================

interface SmsTemplateParams {
  vehicleName: string; // napr. "Skoda Octavia 2020"
  brokerName?: string;
  brokerPhone?: string;
  price?: number;
  oldPrice?: number;
  newPrice?: number;
  viewingDate?: string;
  viewingTime?: string;
}

const SMS_TEMPLATES: Record<SmsTemplateType, (params: SmsTemplateParams) => string> = {
  VEHICLE_APPROVED: ({ vehicleName, brokerName, brokerPhone }) =>
    `Carmakler: Vas vuz ${vehicleName} byl publikovan. Makler ${brokerName ?? ""}, tel: ${brokerPhone ?? ""}`,

  NEW_INQUIRY: ({ vehicleName }) =>
    `O vas vuz ${vehicleName} se zajima kupujici. Makler vas kontaktuje.`,

  VIEWING_SCHEDULED: ({ vehicleName, viewingDate, viewingTime }) =>
    `Prohlidka ${vehicleName} domluvena na ${viewingDate ?? ""} v ${viewingTime ?? ""}.`,

  VEHICLE_SOLD: ({ vehicleName, price }) =>
    `Vas vuz ${vehicleName} byl prodan za ${price ? price.toLocaleString("cs-CZ") : "?"} Kc!`,

  PRICE_REDUCTION: ({ vehicleName, oldPrice, newPrice }) =>
    `Doporucujeme snizit cenu ${vehicleName} z ${oldPrice ? oldPrice.toLocaleString("cs-CZ") : "?"} na ${newPrice ? newPrice.toLocaleString("cs-CZ") : "?"} Kc.`,
};

/**
 * Odesle SMS z sablony
 */
export async function sendTemplateSms({
  template,
  phone,
  vehicleId,
  params,
}: {
  template: SmsTemplateType;
  phone: string;
  vehicleId?: string;
  params: SmsTemplateParams;
}): Promise<SendSmsResult> {
  const templateFn = SMS_TEMPLATES[template];
  const message = templateFn(params);

  return sendSms({ phone, message, vehicleId });
}

/**
 * Zkontroluje, zda uzivatel povolil SMS notifikace pro dany typ udalosti
 */
export async function isSmsEnabledForUser(
  userId: string,
  eventType: string
): Promise<boolean> {
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId_eventType: { userId, eventType } },
  });

  // Pokud preference neexistuje, SMS je default vypnuta
  return pref?.smsEnabled ?? false;
}

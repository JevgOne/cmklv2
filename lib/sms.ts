import { prisma } from "@/lib/prisma";
import type { SmsTemplateType } from "@/lib/validators/notifications";

// ============================================
// SMS WRAPPER — GoSMS.cz / Twilio / dev mode
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

type SmsProvider = "gosms" | "twilio" | "dev";

/**
 * Detekuje dostupneho SMS providera podle env promennych
 */
function detectSmsProvider(): SmsProvider {
  if (process.env.GOSMS_API_KEY) return "gosms";
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) return "twilio";
  return "dev";
}

/**
 * Odesle SMS pres GoSMS.cz API
 * https://doc.gosms.cz/
 */
async function sendViaGoSms(phone: string, message: string): Promise<{ success: boolean; externalId?: string; error?: string }> {
  const apiKey = process.env.GOSMS_API_KEY!;
  const channel = process.env.GOSMS_CHANNEL_ID || "1";

  try {
    const response = await fetch("https://app.gosms.cz/api/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        recipients: phone,
        channel: parseInt(channel, 10),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[SMS:GoSMS] API error:", response.status, errorBody);
      return { success: false, error: `GoSMS API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, externalId: data.id?.toString() };
  } catch (error) {
    console.error("[SMS:GoSMS] Request failed:", error);
    return { success: false, error: "GoSMS request failed" };
  }
}

/**
 * Odesle SMS pres Twilio API
 */
async function sendViaTwilio(phone: string, message: string): Promise<{ success: boolean; externalId?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER!;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const body = new URLSearchParams({
      To: phone,
      From: fromPhone,
      Body: message,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[SMS:Twilio] API error:", response.status, errorBody);
      return { success: false, error: `Twilio API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, externalId: data.sid };
  } catch (error) {
    console.error("[SMS:Twilio] Request failed:", error);
    return { success: false, error: "Twilio request failed" };
  }
}

/**
 * Odesle SMS (GoSMS.cz / Twilio / dev console.log)
 * Rate limiting: max 5 SMS/den na cislo
 */
export async function sendSms({
  phone,
  message,
  vehicleId,
}: SendSmsParams): Promise<SendSmsResult> {
  // Rate limiting — max 5 SMS/den na cislo
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

  const provider = detectSmsProvider();

  try {
    let externalId: string | undefined;

    if (provider === "gosms") {
      const result = await sendViaGoSms(phone, message);
      if (!result.success) {
        throw new Error(result.error || "GoSMS send failed");
      }
      externalId = result.externalId;
      console.log(`[SMS:GoSMS] Sent to ${phone}, id: ${externalId}`);
    } else if (provider === "twilio") {
      const result = await sendViaTwilio(phone, message);
      if (!result.success) {
        throw new Error(result.error || "Twilio send failed");
      }
      externalId = result.externalId;
      console.log(`[SMS:Twilio] Sent to ${phone}, sid: ${externalId}`);
    } else {
      // Dev mode — console.log, bez realneho odeslani
      console.log(`[SMS:DEV] To: ${phone} | Message: ${message}`);
    }

    // Zalogovat do DB
    const smsLog = await prisma.smsLog.create({
      data: {
        recipientPhone: phone,
        message,
        vehicleId: vehicleId ?? null,
        status: "SENT",
        cost: null,
      },
    });

    return { success: true, smsLogId: smsLog.id };
  } catch (error) {
    console.error(`[SMS:${provider}] Chyba pri odesilani:`, error);

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

/**
 * Zkontroluje opt-out prodejce pred odeslanim SMS
 * Vraci true pokud SMS muze byt odeslana
 */
export async function canSendSmsToSeller(
  sellerContactId: string,
  eventType: string
): Promise<boolean> {
  const seller = await prisma.sellerContact.findUnique({
    where: { id: sellerContactId },
    select: { smsOptOut: true },
  });

  // Globalni opt-out
  if (seller?.smsOptOut) return false;

  // Per-event preference
  const pref = await prisma.sellerNotificationPreference.findUnique({
    where: {
      sellerContactId_eventType: { sellerContactId, eventType },
    },
  });

  // Pokud preference neexistuje, SMS je default povolena
  return pref?.smsEnabled ?? true;
}

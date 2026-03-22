import { z } from "zod";

export const NOTIFICATION_EVENT_TYPES = [
  "NEW_LEAD",
  "NEW_INQUIRY",
  "VEHICLE_APPROVED",
  "VEHICLE_REJECTED",
  "VEHICLE_SOLD",
  "DAILY_SUMMARY",
  "VEHICLE_30_DAYS",
  "ACHIEVEMENT",
  "LEADERBOARD",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export const notificationPreferenceSchema = z.object({
  eventType: z.enum(NOTIFICATION_EVENT_TYPES),
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean().optional().default(false),
});

export const updateNotificationPreferencesSchema = z.object({
  preferences: z.array(notificationPreferenceSchema).min(1),
});

export const sendSmsSchema = z.object({
  phone: z
    .string()
    .min(1, "Telefonni cislo je povinne")
    .regex(/^\+?[0-9]{9,15}$/, "Neplatne telefonni cislo"),
  message: z.string().min(1).max(160, "SMS nesmi presahnout 160 znaku"),
  vehicleId: z.string().optional(),
});

export const SMS_TEMPLATE_TYPES = [
  "VEHICLE_APPROVED",
  "NEW_INQUIRY",
  "VIEWING_SCHEDULED",
  "VEHICLE_SOLD",
  "PRICE_REDUCTION",
] as const;

export type SmsTemplateType = (typeof SMS_TEMPLATE_TYPES)[number];

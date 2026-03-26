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

// Managerske event typy
export const MANAGER_EVENT_TYPES = [
  "ONBOARDING_COMPLETED",
  "LISTING_PENDING",
  "BROKER_REJECTED_VEHICLE",
  "VEHICLE_60_DAYS",
  "WEEKLY_REPORT",
] as const;

export type ManagerEventType = (typeof MANAGER_EVENT_TYPES)[number];

// Seller event typy (prodejce = majitel auta)
export const SELLER_EVENT_TYPES = [
  "VEHICLE_APPROVED",
  "NEW_INQUIRY",
  "VIEWING_SCHEDULED",
  "VEHICLE_SOLD",
  "PRICE_REDUCTION",
] as const;

export type SellerEventType = (typeof SELLER_EVENT_TYPES)[number];

export const sellerNotificationPreferenceSchema = z.object({
  eventType: z.enum(SELLER_EVENT_TYPES),
  smsEnabled: z.boolean(),
  emailEnabled: z.boolean(),
});

// Vsechny event typy (broker + manager) pro upsert API
export const ALL_NOTIFICATION_EVENT_TYPES = [
  ...NOTIFICATION_EVENT_TYPES,
  ...MANAGER_EVENT_TYPES,
] as const;

export const notificationPreferenceSchema = z.object({
  eventType: z.enum(ALL_NOTIFICATION_EVENT_TYPES),
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

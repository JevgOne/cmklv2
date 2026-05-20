import { z } from "zod";

export const SCOUT_LEAD_CATEGORIES = [
  "VRAKOVISTE",
  "AUTOBAZAR",
  "SOUKROMNIK",
] as const;

export const SCOUT_LEAD_COUNTRIES = ["CZ", "DE", "AT", "SK", "PL"] as const;

export const SCOUT_LEAD_SOURCES = [
  "GOOGLE_PLACES",
  "ARES",
  "FIRMY_CZ",
  "ZLATESTRANKY",
  "HANDELSREGISTER",
  "BAZOS",
  "SBAZAR",
  "SAUTO",
  "TIPCARS",
  "MOBILE_DE",
  "AUTOSCOUT24",
  "MANUAL",
] as const;

export const SCOUT_LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "REJECTED",
  "WON",
  "LOST",
] as const;

// Schema for single lead in batch ingest
const scoutLeadPayloadSchema = z.object({
  category: z.enum(SCOUT_LEAD_CATEGORIES),
  country: z.enum(SCOUT_LEAD_COUNTRIES).default("CZ"),
  source: z.enum(SCOUT_LEAD_SOURCES),
  sourceId: z.string().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  name: z.string().min(1, "Název je povinný"),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  web: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  ico: z.string().optional().nullable(),
  estimatedSize: z
    .enum(["SMALL", "MEDIUM", "LARGE"])
    .optional()
    .nullable(),
  googleRating: z.number().min(0).max(5).optional().nullable(),
  googleReviewCount: z.number().int().min(0).optional().nullable(),
  estimatedInventory: z.number().int().min(0).optional().nullable(),
  inventoryTrend: z.enum(["UP", "DOWN", "STABLE"]).optional().nullable(),
  vehicleBrand: z.string().optional().nullable(),
  vehicleModel: z.string().optional().nullable(),
  vehicleYear: z
    .number()
    .int()
    .min(1900)
    .max(2100)
    .optional()
    .nullable(),
  vehiclePrice: z.number().int().min(0).optional().nullable(),
  vehicleMileage: z.number().int().min(0).optional().nullable(),
  listingTitle: z.string().optional().nullable(),
  rawPayload: z.any().optional().nullable(),
  score: z.number().int().min(0).max(100).default(0),
});

export type ScoutLeadPayload = z.infer<typeof scoutLeadPayloadSchema>;

// Batch ingest schema (M2M API)
export const scoutLeadIngestSchema = z.object({
  leads: z.array(scoutLeadPayloadSchema).min(1).max(100),
});

// Update schema (admin PATCH)
export const scoutLeadUpdateSchema = z.object({
  status: z.enum(SCOUT_LEAD_STATUSES).optional(),
  notes: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
});

// Assign schema
export const scoutLeadAssignSchema = z.object({
  assignedToId: z.string().min(1, "ID uživatele je povinné"),
});

// Reject schema
export const scoutLeadRejectSchema = z.object({
  reason: z.string().min(1, "Důvod odmítnutí je povinný"),
});

// Activity schema
export const scoutLeadActivitySchema = z.object({
  type: z.enum([
    "POZNAMKA",
    "TELEFONAT",
    "EMAIL",
    "ZMENA_STAVU",
    "SYSTEM",
    "KONVERZE",
  ]),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
});

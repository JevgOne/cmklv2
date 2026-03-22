import { z } from "zod";

export const PARTNER_TYPES = ["AUTOBAZAR", "VRAKOVISTE"] as const;
export const PARTNER_SIZES = ["SMALL", "MEDIUM", "LARGE"] as const;
export const PARTNER_SOURCES = ["FIRMY_CZ", "GOOGLE", "SAUTO", "TIPCARS", "BAZOS", "MANUAL"] as const;
export const PARTNER_STATUSES = [
  "NEOSLOVENY",
  "PRIRAZENY",
  "OSLOVEN",
  "JEDNAME",
  "AKTIVNI_PARTNER",
  "ODMITNUTO",
  "POZASTAVENO",
] as const;
export const ACTIVITY_TYPES = ["POZNAMKA", "NAVSTEVA", "TELEFONAT", "EMAIL", "ZMENA_STAVU", "SYSTEM"] as const;
export const PARTNER_LEAD_STATUSES = ["NOVY", "KONTAKTOVAN", "DOMLUVENO", "PRODANO", "NEZAJEM"] as const;

export const createPartnerSchema = z.object({
  name: z.string().min(1, "Nazev je povinny"),
  type: z.enum(PARTNER_TYPES),
  ico: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Neplatny email").optional().nullable(),
  web: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  estimatedSize: z.enum(PARTNER_SIZES).optional().nullable(),
  googleRating: z.number().min(0).max(5).optional().nullable(),
  googleReviewCount: z.number().int().min(0).optional().nullable(),
  source: z.enum(PARTNER_SOURCES).optional().nullable(),
  notes: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const updatePartnerSchema = createPartnerSchema.partial().extend({
  status: z.enum(PARTNER_STATUSES).optional(),
  managerId: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  openingHours: z.string().optional().nullable(),
});

export const createActivitySchema = z.object({
  type: z.enum(["POZNAMKA", "NAVSTEVA", "TELEFONAT", "EMAIL"]),
  title: z.string().min(1, "Nazev je povinny"),
  description: z.string().optional().nullable(),
  nextContactDate: z.string().datetime().optional().nullable(),
});

export const updatePartnerLeadSchema = z.object({
  status: z.enum(PARTNER_LEAD_STATUSES).optional(),
  notes: z.string().optional().nullable(),
});

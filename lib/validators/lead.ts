import { z } from "zod";

export const LEAD_SOURCES = ["WEB_FORM", "EXTERNAL_APP", "MANUAL", "REFERRAL"] as const;
export const LEAD_STATUSES = [
  "NEW",
  "ASSIGNED",
  "CONTACTED",
  "MEETING_SCHEDULED",
  "VEHICLE_ADDED",
  "REJECTED",
  "EXPIRED",
] as const;

export const externalLeadSchema = z.object({
  name: z.string().min(1, "Jméno je povinné"),
  phone: z.string().min(1, "Telefon je povinný"),
  email: z.string().email("Neplatný email").optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  mileage: z.number().int().min(0).optional().nullable(),
  expectedPrice: z.number().int().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  sourceDetail: z.string().optional().nullable(),
});

export const manualLeadSchema = z.object({
  name: z.string().min(1, "Jméno je povinné"),
  phone: z.string().min(1, "Telefon je povinný"),
  email: z.string().email("Neplatný email").optional().nullable(),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  mileage: z.number().int().min(0).optional().nullable(),
  expectedPrice: z.number().int().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  source: z.enum(["MANUAL", "REFERRAL"]),
  sourceDetail: z.string().optional().nullable(),
});

export const assignLeadSchema = z.object({
  assignedToId: z.string().min(1, "ID makléře je povinné"),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(LEAD_STATUSES),
  rejectionReason: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  meetingDate: z.string().datetime().optional().nullable(),
});

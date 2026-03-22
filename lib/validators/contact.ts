import { z } from "zod";

export const COMMUNICATION_TYPES = ["CALL", "SMS", "EMAIL", "MEETING", "NOTE"] as const;
export const COMMUNICATION_DIRECTIONS = ["OUTGOING", "INCOMING"] as const;
export const COMMUNICATION_RESULTS = ["INTERESTED", "NOT_NOW", "REJECTED", "FOLLOW_UP"] as const;

export const createContactSchema = z.object({
  name: z.string().min(1, "Jméno je povinné"),
  phone: z.string().min(1, "Telefon je povinný"),
  email: z.string().email("Neplatný email").optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  nextFollowUp: z.string().datetime().optional().nullable(),
  followUpNote: z.string().optional().nullable(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1, "Jméno je povinné").optional(),
  phone: z.string().min(1, "Telefon je povinný").optional(),
  email: z.string().email("Neplatný email").optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  nextFollowUp: z.string().datetime().optional().nullable(),
  followUpNote: z.string().optional().nullable(),
});

export const createCommunicationSchema = z.object({
  type: z.enum(COMMUNICATION_TYPES),
  direction: z.enum(COMMUNICATION_DIRECTIONS).optional().nullable(),
  summary: z.string().min(1, "Popis je povinný"),
  duration: z.number().int().min(0).optional().nullable(),
  result: z.enum(COMMUNICATION_RESULTS).optional().nullable(),
  nextFollowUp: z.string().datetime().optional().nullable(),
  followUpNote: z.string().optional().nullable(),
});

export const syncContactsSchema = z.object({
  changes: z.array(
    z.object({
      action: z.enum(["CREATE", "UPDATE", "DELETE"]),
      id: z.string().optional(),
      data: z.record(z.string(), z.unknown()).optional(),
      updatedAt: z.number(),
    })
  ),
});

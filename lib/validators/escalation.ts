import { z } from "zod";

export const ESCALATION_TYPES = [
  "SELLER_ISSUE",
  "FRAUD_SUSPICION",
  "TECHNICAL",
  "EXCLUSIVITY_VIOLATION",
  "OTHER",
] as const;

export const ESCALATION_URGENCY = ["NORMAL", "URGENT"] as const;

export const ESCALATION_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export const createEscalationSchema = z.object({
  type: z.enum(ESCALATION_TYPES),
  urgency: z.enum(ESCALATION_URGENCY).default("NORMAL"),
  description: z.string().min(10, "Popis musí mít alespoň 10 znaků"),
  attachments: z.array(z.string().url()).optional(),
  vehicleId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
});

export const updateEscalationSchema = z.object({
  status: z.enum(ESCALATION_STATUSES).optional(),
  resolution: z.string().optional().nullable(),
});

export const transferVehiclesSchema = z.object({
  vehicleIds: z.array(z.string()).min(1, "Vyberte alespoň jedno vozidlo"),
  targetBrokerId: z.string().min(1, "Vyberte cílového makléře"),
  reason: z.string().min(1, "Důvod přenosu je povinný"),
});

export type CreateEscalationInput = z.infer<typeof createEscalationSchema>;
export type UpdateEscalationInput = z.infer<typeof updateEscalationSchema>;
export type TransferVehiclesInput = z.infer<typeof transferVehiclesSchema>;

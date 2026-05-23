import { z } from "zod";

export const createWorkflowRequestSchema = z.object({
  type: z.enum([
    "FINANCING", "INSURANCE", "DOCUMENT", "APPROVAL", "SUPPORT",
    "INSPECTION", "CLIENT_VERIFICATION", "HANDOVER", "PRICE_CHANGE",
    "COMPLAINT", "ONBOARDING", "INTERNAL_TASK", "QUESTION", "BUG_REPORT",
    "OTHER",
  ]),
  category: z.string().optional().nullable(),
  title: z.string().min(3, "Název musí mít alespoň 3 znaky").max(200),
  description: z.string().min(10, "Popis musí mít alespoň 10 znaků"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  vehicleId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  contractId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  inquiryId: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateWorkflowRequestSchema = z.object({
  status: z.enum([
    "QUEUED", "ASSIGNED", "IN_PROGRESS", "WAITING_INFO", "WAITING_APPROVAL",
    "ESCALATED", "RESOLVED", "CLOSED", "CANCELLED",
  ]).optional(),
  assignedToId: z.string().optional().nullable(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  resolution: z.string().optional(),
  escalationReason: z.string().optional(),
});

export const createWorkflowCommentSchema = z.object({
  content: z.string().min(1, "Komentář nesmí být prázdný").max(5000),
  isInternal: z.boolean().default(false),
  parentId: z.string().optional().nullable(),
});

export const assignWorkflowRequestSchema = z.object({
  assignedToId: z.string().min(1),
});

export type CreateWorkflowRequest = z.infer<typeof createWorkflowRequestSchema>;
export type UpdateWorkflowRequest = z.infer<typeof updateWorkflowRequestSchema>;
export type CreateWorkflowComment = z.infer<typeof createWorkflowCommentSchema>;

import { z } from "zod";

export const EMAIL_TEMPLATE_TYPES = [
  "PRESENTATION",
  "CONTRACT_OFFER",
  "FOLLOWUP",
  "INSURANCE",
  "FINANCING",
  "PRICE_CHANGE",
  "VEHICLE_SOLD",
] as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number];

export const sendEmailSchema = z.object({
  templateType: z.enum(EMAIL_TEMPLATE_TYPES),
  recipientEmail: z.string().email("Neplatný email"),
  recipientName: z.string().min(1, "Jméno příjemce je povinné"),
  vehicleId: z.string().optional(),
  customText: z.string().max(2000, "Text může mít maximálně 2000 znaků").optional(),
  // Extra variables for specific templates
  variables: z
    .object({
      price: z.number().optional(),
      newPrice: z.number().optional(),
      reason: z.string().optional(),
      monthlyPayment: z.number().optional(),
      salePrice: z.number().optional(),
    })
    .optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;

export const previewEmailSchema = z.object({
  templateType: z.enum(EMAIL_TEMPLATE_TYPES),
  recipientName: z.string().optional(),
  vehicleId: z.string().optional(),
  customText: z.string().optional(),
  variables: z
    .object({
      price: z.number().optional(),
      newPrice: z.number().optional(),
      reason: z.string().optional(),
      monthlyPayment: z.number().optional(),
      salePrice: z.number().optional(),
    })
    .optional(),
});

export type PreviewEmailInput = z.infer<typeof previewEmailSchema>;

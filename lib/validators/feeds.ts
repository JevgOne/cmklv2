import { z } from "zod";

export const createFeedConfigSchema = z.object({
  supplierId: z.string().min(1, "Dodavatel je povinný"),
  name: z.string().min(1, "Název je povinný"),
  feedUrl: z.string().url("Neplatná URL"),
  feedFormat: z.enum(["XML", "CSV", "JSON"]),
  fieldMapping: z.record(z.string(), z.string()).optional(),
  updateFrequency: z.enum(["DAILY", "WEEKLY", "MANUAL"]).default("DAILY"),
  markupType: z.enum(["PERCENT", "FIXED"]).default("PERCENT"),
  markupValue: z.number().min(0).default(25),
  categoryMarkups: z.record(z.string(), z.number()).optional(),
  defaultPartType: z.enum(["NEW", "AFTERMARKET"]).default("AFTERMARKET"),
  isActive: z.boolean().default(true),
});

export const updateFeedConfigSchema = createFeedConfigSchema.partial();

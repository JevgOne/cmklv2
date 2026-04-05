import { z } from "zod";

export const createReturnSchema = z.object({
  type: z.enum(["WITHDRAWAL", "WARRANTY"]),
  items: z.array(z.object({
    orderItemId: z.string().min(1),
    quantity: z.number().int().min(1),
    reason: z.string().optional(),
  })).min(1, "Vyberte alespon jednu polozku"),
  reason: z.string().min(10, "Popiste duvod (min. 10 znaku)"),
  defectDesc: z.string().optional(),
  photos: z.array(z.string().url()).optional(),
  contactName: z.string().min(1, "Jmeno je povinne"),
  contactEmail: z.string().email("Neplatny email"),
  contactPhone: z.string().optional(),
  bankAccount: z.string().optional(),
});

export type CreateReturnInput = z.infer<typeof createReturnSchema>;

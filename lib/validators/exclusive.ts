import { z } from "zod";

// ============================================
// Prodloužení exkluzivity
// ============================================

export const extendExclusiveSchema = z.object({
  duration: z.enum(["1", "2", "3", "6"], {
    message: "Vyberte dobu prodloužení",
  }),
  sellerSignature: z.string().min(1, "Podpis prodejce je povinný"),
});

// ============================================
// Ukončení exkluzivní smlouvy
// ============================================

export const terminateExclusiveSchema = z.object({
  reason: z.enum(
    [
      "SELLER_CHANGED_MIND",
      "SELLER_SOLD_PRIVATELY",
      "VEHICLE_UNDRIVABLE",
      "OTHER",
    ],
    { message: "Vyberte důvod ukončení" }
  ),
  note: z.string().optional(),
});

// ============================================
// Nahlášení porušení exkluzivity
// ============================================

export const reportViolationSchema = z.object({
  description: z.string().min(1, "Popis porušení je povinný"),
  evidenceUrl: z.string().url("Neplatná URL").optional().or(z.literal("")),
  evidenceImage: z.string().optional(),
});

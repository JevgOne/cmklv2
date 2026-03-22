import { z } from "zod";

// ============================================
// Dotaz kupujícího (VehicleInquiry)
// ============================================

export const createInquirySchema = z.object({
  buyerName: z.string().min(1, "Jméno je povinné"),
  buyerPhone: z.string().min(9, "Telefon je povinný"),
  buyerEmail: z.string().email("Neplatný email").optional().or(z.literal("")),
  message: z.string().min(1, "Zpráva je povinná"),
});

export const updateInquirySchema = z.object({
  status: z
    .enum([
      "NEW",
      "REPLIED",
      "VIEWING_SCHEDULED",
      "NEGOTIATING",
      "RESERVED",
      "SOLD",
      "NO_INTEREST",
    ])
    .optional(),
  reply: z.string().optional(),
  viewingDate: z.string().datetime().optional(),
  viewingResult: z.enum(["INTERESTED", "THINKING", "NO_INTEREST"]).optional(),
  offeredPrice: z.number().int().min(0).optional(),
  agreedPrice: z.number().int().min(0).optional(),
});

// ============================================
// Rezervace vozidla
// ============================================

export const reserveVehicleSchema = z.object({
  buyerName: z.string().min(1, "Jméno kupujícího je povinné"),
  buyerPhone: z.string().min(9, "Telefon kupujícího je povinný"),
  buyerEmail: z.string().email().optional().or(z.literal("")),
  agreedPrice: z.number().int().min(0, "Dohodnutá cena je povinná"),
  handoverDate: z.string().datetime().optional(),
});

// ============================================
// Předání vozidla (handover)
// ============================================

export const handoverVehicleSchema = z.object({
  soldPrice: z.number().int().min(0, "Prodejní cena je povinná"),
  checklist: z.object({
    documentsHandedOver: z.boolean(),
    keysHandedOver: z.boolean(),
    vehicleInspected: z.boolean(),
    buyerSatisfied: z.boolean(),
    paymentReceived: z.boolean(),
  }),
  note: z.string().optional(),
});

// ============================================
// Hlášení poškození (DamageReport)
// ============================================

export const createDamageSchema = z.object({
  description: z.string().min(1, "Popis poškození je povinný"),
  severity: z.enum(["COSMETIC", "FUNCTIONAL", "SEVERE"]),
  images: z.array(z.string().url()).optional(),
});

export const repairDamageSchema = z.object({
  repairNote: z.string().min(1, "Poznámka k opravě je povinná"),
});

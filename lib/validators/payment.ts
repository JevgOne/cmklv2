import { z } from "zod";

// ============================================
// Platba — vytvoření Stripe Checkout
// ============================================

export const createCheckoutSchema = z.object({
  vehicleId: z.string().min(1, "ID vozidla je povinné"),
  buyerName: z.string().min(1, "Jméno kupujícího je povinné"),
  buyerEmail: z.string().email("Neplatný email"),
  buyerPhone: z.string().min(9, "Telefon je povinný").optional(),
  method: z.enum(["CARD", "BANK_TRANSFER", "FINANCING"]),
});

// ============================================
// Potvrzení platby převodem (BackOffice)
// ============================================

export const confirmPaymentSchema = z.object({
  note: z.string().optional(),
});

// ============================================
// Zpracování výplaty prodejci
// ============================================

export const processSellerPayoutSchema = z.object({
  bankReference: z.string().min(1, "Reference převodu je povinná"),
});

// ============================================
// Nahrání faktury makléřem
// ============================================

export const uploadInvoiceSchema = z.object({
  invoiceUrl: z.string().url("Neplatná URL faktury"),
  invoiceNumber: z.string().min(1, "Číslo faktury je povinné"),
});

// ============================================
// Generování měsíční uzávěrky
// ============================================

export const generatePayoutSchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Období musí být ve formátu YYYY-MM"),
});

import { z } from "zod";

const flipStatuses = [
  "PENDING_APPROVAL", "APPROVED", "FUNDING", "FUNDED", "IN_REPAIR",
  "FOR_SALE", "SOLD", "PAYOUT_PENDING", "COMPLETED", "CANCELLED",
] as const;

const vehicleConditions = [
  "NEW", "LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "DAMAGED",
] as const;

const paymentStatuses = ["PENDING", "CONFIRMED", "REFUNDED"] as const;

// Vytvoření flip příležitosti (dealer)
export const createOpportunitySchema = z.object({
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  year: z.number().int().min(1900).max(2100),
  mileage: z.number().int().min(0),
  vin: z.string().optional(),
  condition: z.enum(vehicleConditions),
  photos: z.array(z.string().url()).optional(),
  purchasePrice: z.number().int().min(1, "Nákupní cena je povinná"),
  repairCost: z.number().int().min(0),
  estimatedSalePrice: z.number().int().min(1, "Odhadovaná prodejní cena je povinná"),
  repairDescription: z.string().optional(),
  repairPhotos: z.array(z.string().url()).optional(),
});

// Aktualizace příležitosti (dealer/admin)
export const updateOpportunitySchema = z.object({
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  mileage: z.number().int().min(0).optional(),
  vin: z.string().optional(),
  condition: z.enum(vehicleConditions).optional(),
  photos: z.array(z.string().url()).optional(),
  purchasePrice: z.number().int().min(1).optional(),
  repairCost: z.number().int().min(0).optional(),
  estimatedSalePrice: z.number().int().min(1).optional(),
  repairDescription: z.string().optional(),
  repairPhotos: z.array(z.string().url()).optional(),
  actualSalePrice: z.number().int().min(1).optional(),
  status: z.enum(flipStatuses).optional(),
  adminNotes: z.string().optional(),
});

// Filtr příležitostí
export const opportunityFilterSchema = z.object({
  status: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().int().optional(),
  maxPrice: z.coerce.number().int().optional(),
  dealerId: z.string().optional(),
  sort: z.enum(["newest", "cheapest", "expensive", "highest_roi"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

// Schválení/zamítnutí (admin)
export const approveOpportunitySchema = z.object({
  approved: z.boolean(),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

// Výplata (admin)
export const payoutSchema = z.object({
  actualSalePrice: z.number().int().min(1, "Prodejní cena je povinná"),
});

// Investice
export const createInvestmentSchema = z.object({
  opportunityId: z.string().min(1, "ID příležitosti je povinné"),
  amount: z.number().int().min(10000, "Minimální investice je 10 000 Kč"),
});

// Potvrzení platby (admin)
export const confirmPaymentSchema = z.object({
  paymentReference: z.string().min(1, "Číslo platby je povinné"),
});

// Filtr investic
export const investmentFilterSchema = z.object({
  paymentStatus: z.enum(paymentStatuses).optional(),
  opportunityId: z.string().optional(),
  sort: z.enum(["newest", "amount_asc", "amount_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

// Žádost o přístup — PUBLIC (nevyžaduje login)
export const applySchema = z
  .object({
    role: z.enum(["VERIFIED_DEALER", "INVESTOR"]),
    firstName: z.string().min(2, "Jméno je povinné"),
    lastName: z.string().min(2, "Příjmení je povinné"),
    email: z.string().email("Neplatný email"),
    phone: z.string().min(9, "Telefon je povinný (min. 9 znaků)"),
    companyName: z.string().optional(),
    ico: z
      .string()
      .regex(/^\d{8}$/, "IČO musí mít 8 číslic")
      .optional()
      .or(z.literal("")),
    investmentRange: z
      .enum(["10k-50k", "50k-200k", "200k-1M", "1M+"])
      .optional(),
    message: z
      .string()
      .min(10, "Zpráva musí mít alespoň 10 znaků")
      .max(2000, "Zpráva je příliš dlouhá (max 2000 znaků)"),
    gdprConsent: z.literal(true, {
      message: "Musíte souhlasit se zpracováním osobních údajů",
    }),
  })
  .refine(
    (data) =>
      data.role !== "VERIFIED_DEALER" ||
      (!!data.companyName && data.companyName.length > 0 && !!data.ico && data.ico.length > 0),
    {
      message: "Dealer musí vyplnit název firmy a IČO",
      path: ["companyName"],
    }
  );

import { z } from "zod";

const partCategories = [
  "ENGINE", "TRANSMISSION", "BRAKES", "SUSPENSION", "BODY",
  "ELECTRICAL", "INTERIOR", "WHEELS", "EXHAUST", "COOLING", "FUEL", "OTHER",
] as const;

const partConditions = [
  "NEW", "USED_GOOD", "USED_FAIR", "USED_POOR", "REFURBISHED",
] as const;

export const createPartSchema = z.object({
  name: z.string().min(1, "Název je povinný"),
  category: z.enum(partCategories),
  description: z.string().optional(),
  partNumber: z.string().optional(),
  oemNumber: z.string().optional(),
  condition: z.enum(partConditions),
  price: z.number().int().min(1, "Cena musí být alespoň 1 Kč"),
  currency: z.string().default("CZK"),
  vatIncluded: z.boolean().default(true),
  stock: z.number().int().min(0).default(1),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  compatibleBrands: z.array(z.string()).optional(),
  compatibleModels: z.array(z.string()).optional(),
  compatibleYearFrom: z.number().int().min(1900).max(2100).optional(),
  compatibleYearTo: z.number().int().min(1900).max(2100).optional(),
  universalFit: z.boolean().default(false),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        order: z.number().int().min(0),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
});

export const updatePartSchema = createPartSchema.partial();

export const partFilterSchema = z.object({
  category: z.string().optional(),
  condition: z.string().optional(),
  partType: z.string().optional(), // USED, NEW, AFTERMARKET
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
  minPrice: z.coerce.number().int().optional(),
  maxPrice: z.coerce.number().int().optional(),
  inStock: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "cheapest", "expensive", "popular"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(18),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        partId: z.string().min(1),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, "Košík nesmí být prázdný"),
  deliveryName: z.string().min(1, "Jméno je povinné"),
  deliveryPhone: z.string().min(9, "Telefon je povinný"),
  deliveryEmail: z.string().email("Neplatný email"),
  deliveryAddress: z.string().min(1, "Adresa je povinná"),
  deliveryCity: z.string().min(1, "Město je povinné"),
  deliveryZip: z.string().min(3, "PSČ je povinné"),
  deliveryMethod: z.enum(["ZASILKOVNA", "PPL", "CESKA_POSTA", "PICKUP"]),
  zasilkovnaPointId: z.string().optional(),
  zasilkovnaPointName: z.string().optional(),
  paymentMethod: z.enum(["BANK_TRANSFER", "COD", "CARD"]),
  note: z.string().optional(),
}).refine(
  (data) => data.deliveryMethod !== "ZASILKOVNA" || !!data.zasilkovnaPointId,
  { message: "Vyberte výdejní místo Zásilkovny", path: ["zasilkovnaPointId"] }
);

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  trackingNumber: z.string().optional(),
});

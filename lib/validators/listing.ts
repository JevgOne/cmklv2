import { z } from "zod";

export const createListingSchema = z.object({
  listingType: z.enum(["PRIVATE", "DEALER", "BROKER"]),
  vehicleId: z.string().optional(),

  // Vozidlo
  vin: z.string().optional(),
  brand: z.string().min(1, "Značka je povinná"),
  model: z.string().min(1, "Model je povinný"),
  variant: z.string().optional(),
  year: z.number().int().min(1900).max(2100),
  mileage: z.number().int().min(0),
  fuelType: z.enum(["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "PLUGIN_HYBRID", "LPG", "CNG"]),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "DSG", "CVT"]),
  enginePower: z.number().int().positive().optional(),
  engineCapacity: z.number().int().positive().optional(),
  bodyType: z.enum(["SEDAN", "HATCHBACK", "COMBI", "SUV", "COUPE", "CABRIO", "VAN", "PICKUP"]).optional(),
  color: z.string().optional(),
  doorsCount: z.number().int().min(2).max(6).optional(),
  seatsCount: z.number().int().min(1).max(9).optional(),
  drivetrain: z.enum(["FRONT", "REAR", "4x4"]).optional(),

  // Stav
  condition: z.enum(["NEW", "LIKE_NEW", "EXCELLENT", "GOOD", "FAIR", "DAMAGED"]),
  serviceBook: z.boolean().optional(),
  stkValidUntil: z.string().datetime().optional(),
  odometerStatus: z.enum(["VERIFIED", "UNVERIFIED", "TAMPERED"]).optional(),
  ownerCount: z.number().int().min(0).optional(),
  originCountry: z.string().optional(),

  // Cena
  price: z.number().int().min(0),
  priceNegotiable: z.boolean().default(true),
  vatStatus: z.enum(["DEDUCTIBLE", "NON_DEDUCTIBLE", "MARGIN_SCHEME"]).optional(),

  // Kontakt
  contactName: z.string().min(1, "Jméno je povinné"),
  contactPhone: z.string().min(9, "Telefon je povinný"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  city: z.string().min(1, "Město je povinné"),
  district: z.string().optional(),

  // Obsah
  description: z.string().optional(),
  equipment: z.string().optional(), // JSON array string
  highlights: z.string().optional(), // JSON array string

  // Status
  status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),

  // Propojení
  wantsBrokerHelp: z.boolean().default(false),

  // Obrázky
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

export const updateListingSchema = createListingSchema.partial().omit({ listingType: true });

export const listingFilterSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  bodyType: z.string().optional(),
  city: z.string().optional(),
  listingType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minYear: z.coerce.number().optional(),
  maxYear: z.coerce.number().optional(),
  isPremium: z.coerce.boolean().optional(),
  sort: z.enum(["newest", "cheapest", "expensive", "lowestkm"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(18),
});

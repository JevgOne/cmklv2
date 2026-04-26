import { z } from "zod";

export const createDonorVehicleSchema = z.object({
  vehicle: z.object({
    vin: z.string().min(1, "VIN je povinný").max(17),
    kTypeId: z.number().int().optional().nullable(),
    brand: z.string().min(1, "Značka je povinná"),
    model: z.string().min(1, "Model je povinný"),
    year: z.number().int().min(1900).max(2100).optional().nullable(),
    variant: z.string().optional().nullable(),
    engine: z.string().optional().nullable(),
    fuel: z.string().optional().nullable(),
    transmission: z.string().optional().nullable(),
  }),
  disposalType: z.enum(["ACCIDENT", "MECHANICAL", "COMPLETE", "FLOOD", "FIRE"]),
  damageZones: z
    .record(z.string(), z.enum(["ok", "light", "heavy", "destroyed"]))
    .optional(),
  photos: z.array(z.string()).optional(),
  parts: z
    .array(
      z.object({
        name: z.string().min(1, "Název dílu je povinný"),
        category: z.string().min(1),
        grade: z.enum(["A", "B", "C"]),
        price: z.number().int().min(0),
        priceByAgreement: z.boolean().default(false),
        note: z.string().optional(),
        photo: z.string().optional(),
        tecdocArticleId: z.number().int().optional(),
        tecdocProductGroup: z.string().optional(),
      })
    )
    .min(1, "Musíte vybrat alespoň 1 díl"),
});

export type CreateDonorVehicleInput = z.infer<typeof createDonorVehicleSchema>;

import { z } from "zod";

export const brokerRegistrationSchema = z.object({
  token: z.string().min(1, "Token je povinný"),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků"),
  firstName: z.string().min(1, "Jméno je povinné"),
  lastName: z.string().min(1, "Příjmení je povinné"),
  phone: z.string().min(1, "Telefon je povinný"),
  ico: z.string().min(7, "IČO musí mít alespoň 7 znaků").max(8, "IČO má maximálně 8 znaků").optional().or(z.literal("")),
});

export const profileSchema = z.object({
  avatar: z.string().optional(),
  bio: z.string().max(500, "Bio může mít maximálně 500 znaků").optional(),
  specializations: z.array(z.string()).optional(),
  cities: z.array(z.string()).min(1, "Vyberte alespoň jedno město"),
  bankAccount: z.string().min(1, "Bankovní účet je povinný"),
});

export const documentsSchema = z.object({
  tradeLicense: z.string().min(1, "Živnostenský list je povinný"),
  idFront: z.string().min(1, "Přední strana OP je povinná"),
  idBack: z.string().min(1, "Zadní strana OP je povinná"),
});

export const quizSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export const contractSignSchema = z.object({
  signature: z.string().min(1, "Podpis je povinný"),
});

export const invitationSchema = z.object({
  email: z.string().email("Neplatný formát emailu"),
  name: z.string().optional(),
  regionId: z.string().min(1, "Region je povinný"),
});

export type BrokerRegistrationInput = z.infer<typeof brokerRegistrationSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type DocumentsInput = z.infer<typeof documentsSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type ContractSignInput = z.infer<typeof contractSignSchema>;
export type InvitationInput = z.infer<typeof invitationSchema>;

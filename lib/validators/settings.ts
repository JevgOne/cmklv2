import { z } from "zod";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Aktuální heslo je povinné"),
  newPassword: z.string().min(8, "Nové heslo musí mít alespoň 8 znaků"),
  confirmPassword: z.string().min(1, "Potvrzení hesla je povinné"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Hesla se neshodují",
  path: ["confirmPassword"],
});

export const updateBankAccountSchema = z.object({
  bankAccount: z.string().min(1, "Bankovní účet je povinný").regex(
    /^(CZ\d{22}|\d{1,6}-?\d{1,10}\/\d{4})$/,
    "Neplatný formát bankovního účtu (IBAN nebo číslo účtu/kód banky)"
  ),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;

import type { Partner } from "@prisma/client";

/**
 * Client-safe pure helpers pro Stripe Connect onboarding state.
 * Sdíleno mezi server (`lib/stripe-connect.ts`) a client komponenty
 * (admin UI #161-b, PWA UI #161-c). Nesmí importovat prisma/stripe,
 * jinak by se do client bundle dostal `pg` driver.
 */

export type OnboardingState =
  | "not_started"
  | "in_progress"
  | "complete"
  | "action_required"
  | "disabled";

/**
 * Client-safe Stripe fieldy na Partner recordu (Date → ISO string).
 * Jeden source of truth pro admin i PWA UI — interface se rozšíří
 * do parentova Partner typu přes `extends`.
 */
export interface StripePartnerFields {
  stripeAccountId: string | null;
  stripeDetailsSubmitted: boolean;
  stripePayoutsEnabled: boolean;
  stripeChargesEnabled: boolean;
  stripeRequirementsCurrentlyDue: string[];
  stripeDisabledReason: string | null;
  stripeOnboardingStartedAt: string | null;
  stripeOnboardingCompletedAt: string | null;
  stripeAccountUpdatedAt: string | null;
}

/**
 * Derivuje UI state z DB Partner recordu.
 *
 * Pořadí checků je významné:
 * 1. Žádný accountId → not_started (partner ani nezačal)
 * 2. disabled_reason → disabled (Stripe to zablokoval, admin escalation)
 * 3. payouts_enabled → complete (happy path)
 * 4. currently_due nenull → action_required (partner musí doplnit)
 * 5. jinak → in_progress (Stripe zpracovává KYC)
 */
export function deriveOnboardingState(
  partner: Pick<
    Partner,
    | "stripeAccountId"
    | "stripeDetailsSubmitted"
    | "stripePayoutsEnabled"
    | "stripeRequirementsCurrentlyDue"
    | "stripeDisabledReason"
  >,
): OnboardingState {
  if (!partner.stripeAccountId) return "not_started";
  if (partner.stripeDisabledReason) return "disabled";
  if (partner.stripePayoutsEnabled) return "complete";
  if (partner.stripeRequirementsCurrentlyDue.length > 0) return "action_required";
  return "in_progress";
}

/* ------------------------------------------------------------------ */
/*  CZ i18n mapping pro Stripe requirements.currently_due              */
/*  Minimum mapping (17 klíčů) + fallback pro unknown — comprehensive  */
/*  ~60 klíčů by byl over-engineering pro v1.                          */
/* ------------------------------------------------------------------ */

export const STRIPE_REQUIREMENTS_CZ: Record<string, string> = {
  "individual.first_name": "Jméno",
  "individual.last_name": "Příjmení",
  "individual.dob.day": "Datum narození",
  "individual.dob.month": "Datum narození",
  "individual.dob.year": "Datum narození",
  "individual.verification.document": "Doklad totožnosti",
  "individual.verification.additional_document": "Další doklad totožnosti",
  "business_profile.url": "Webová stránka firmy",
  "business_profile.mcc": "Kategorie podnikání",
  "business_profile.product_description": "Popis produktů",
  "company.tax_id": "DIČ firmy",
  "company.verification.document": "Dokumenty firmy",
  "company.directors_provided": "Informace o vedení",
  "company.owners_provided": "Informace o vlastnících",
  "external_account": "Bankovní účet pro výplaty",
  "tos_acceptance.date": "Souhlas s podmínkami Stripe",
  "tos_acceptance.ip": "Souhlas s podmínkami Stripe",
};

const REQUIREMENT_FALLBACK_CZ = "Další informace požadované Stripem";

export function translateRequirement(key: string): string {
  return STRIPE_REQUIREMENTS_CZ[key] ?? REQUIREMENT_FALLBACK_CZ;
}

/**
 * Přeloží a deduplikuje seznam requirements. `dob.day`, `dob.month`,
 * `dob.year` → jediný "Datum narození". Tos + další duplicitní labely
 * se sjednotí.
 */
export function translateRequirementsList(keys: string[]): string[] {
  const translated = keys.map(translateRequirement);
  return Array.from(new Set(translated));
}

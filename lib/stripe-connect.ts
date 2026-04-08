import type { Partner } from "@prisma/client";
import type { Session } from "next-auth";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// Re-export client-safe pure helpers — single source of truth v stripe-connect-shared.ts
// Umožňuje admin/PWA UI importovat bez pulling pg driveru do client bundle.
export {
  deriveOnboardingState,
  STRIPE_REQUIREMENTS_CZ,
  translateRequirement,
  translateRequirementsList,
} from "@/lib/stripe-connect-shared";
export type { OnboardingState } from "@/lib/stripe-connect-shared";

/* ------------------------------------------------------------------ */
/*  Auth — sdílená resoluce partnera pro Connect API routes             */
/* ------------------------------------------------------------------ */

export function isAdminOrBackoffice(role: string | undefined): boolean {
  return role === "ADMIN" || role === "BACKOFFICE";
}

export type PartnerResolution =
  | { ok: true; partner: Partner; isAdmin: boolean }
  | { ok: false; error: string; status: number };

/**
 * Resolve partner z requestu. Dvě entry points:
 *  - PARTS_SUPPLIER self-service → partner.userId === session.user.id
 *  - ADMIN/BACKOFFICE override → ?partnerId=xxx v query
 * Sdíleno mezi onboard-link, status, dashboard-link.
 */
export async function resolvePartnerForConnect(
  request: NextRequest,
  session: Session,
): Promise<PartnerResolution> {
  if (!session.user?.id) {
    return { ok: false, error: "unauthorized", status: 401 };
  }

  const url = new URL(request.url);
  const adminPartnerId = url.searchParams.get("partnerId");
  const isAdmin = isAdminOrBackoffice(session.user.role);

  let partner: Partner | null;
  if (adminPartnerId) {
    if (!isAdmin) {
      return { ok: false, error: "forbidden", status: 403 };
    }
    partner = await prisma.partner.findUnique({
      where: { id: adminPartnerId },
    });
  } else {
    partner = await prisma.partner.findFirst({
      where: { userId: session.user.id },
    });
  }

  if (!partner) {
    return { ok: false, error: "partner_not_found", status: 404 };
  }
  return { ok: true, partner, isAdmin };
}

/**
 * Vytvoří Stripe Express account pro partnera pokud ještě nemá. Vrací accountId.
 * - `transfers` capability only, žádné `card_payments` (Wolt model: platforma
 *   účtuje, partneři jsou payout recipients → méně compliance).
 * - BEZ `business_type` — Stripe Express UI to vyřeší interaktivně podle IČO/DIČ.
 * - Eager create: volá se při každém POST /onboard-link, ale early return při
 *   existujícím accountId chrání proti duplicitám (replay-safe).
 */
export async function createOrGetConnectAccount(
  partner: Pick<Partner, "id" | "name" | "email" | "web" | "type" | "stripeAccountId">,
): Promise<string> {
  if (partner.stripeAccountId) return partner.stripeAccountId;

  if (!partner.email) {
    throw new Error("Partner nemá email — Stripe Connect účet vyžaduje email.");
  }

  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country: "CZ",
    email: partner.email,
    capabilities: {
      transfers: { requested: true },
    },
    business_profile: {
      name: partner.name,
      url: partner.web ?? undefined,
      mcc: "5533",
      product_description:
        "Použité a nové automobilové díly z vrakoviště / autobazaru",
    },
    metadata: {
      partnerId: partner.id,
      partnerType: partner.type,
    },
  });

  await prisma.partner.update({
    where: { id: partner.id },
    data: { stripeAccountId: account.id },
  });

  return account.id;
}

/**
 * Generuje Stripe hosted onboarding account link (expires ~5 min).
 * Return/refresh paths jsou relativní, helper sestaví absolutní URL z
 * NEXT_PUBLIC_APP_URL. Volající rozhoduje kam se má partner vrátit
 * (admin vs PWA).
 */
export async function createOnboardingLink(params: {
  accountId: string;
  returnPath: string;
  refreshPath: string;
}): Promise<Stripe.AccountLink> {
  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";
  return stripe.accountLinks.create({
    account: params.accountId,
    return_url: `${baseUrl}${params.returnPath}`,
    refresh_url: `${baseUrl}${params.refreshPath}`,
    type: "account_onboarding",
  });
}

/**
 * Express dashboard magic link pro partnery co už dokončili onboarding
 * (úprava bank account, download statements, atd.). Expires ~1 min.
 */
export async function createDashboardLink(
  stripeAccountId: string,
): Promise<Stripe.LoginLink> {
  const stripe = getStripe();
  return stripe.accounts.createLoginLink(stripeAccountId);
}

/**
 * Pull Stripe account aktuální state přes API. Použito manual refresh
 * (POST /status?refresh=1) a admin "Sync ze Stripe" button.
 */
export async function getAccountStatus(
  stripeAccountId: string,
): Promise<Stripe.Account> {
  const stripe = getStripe();
  return stripe.accounts.retrieve(stripeAccountId);
}

/**
 * Synchronizuje Stripe account snapshot do Partner DB recordu.
 * Idempotentní — bezpečné na webhook replay (čistý UPDATE s aktuálními daty).
 *
 * `stripeOnboardingCompletedAt` se nastavuje atomicky jen při první transici
 * (pole dosud NULL) přes `updateMany` s conditional where — race-safe proti
 * paralelním account.updated webhookům. Vrací updated Partner (eliminuje
 * re-read v status route).
 */
export async function syncAccountToDb(
  partnerId: string,
  account: Stripe.Account,
): Promise<Partner> {
  const requirements = account.requirements?.currently_due ?? [];
  const disabledReason = account.requirements?.disabled_reason ?? null;
  const nowComplete = !!account.payouts_enabled;
  const now = new Date();

  if (nowComplete) {
    // Atomic no-op pokud `stripeOnboardingCompletedAt` už bylo nastaveno.
    await prisma.partner.updateMany({
      where: { id: partnerId, stripeOnboardingCompletedAt: null },
      data: { stripeOnboardingCompletedAt: now },
    });
  }

  return prisma.partner.update({
    where: { id: partnerId },
    data: {
      stripeDetailsSubmitted: !!account.details_submitted,
      stripePayoutsEnabled: nowComplete,
      stripeChargesEnabled: !!account.charges_enabled,
      stripeRequirementsCurrentlyDue: requirements,
      stripeDisabledReason: disabledReason,
      stripeAccountUpdatedAt: now,
    },
  });
}

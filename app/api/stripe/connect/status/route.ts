import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  deriveOnboardingState,
  getAccountStatus,
  resolvePartnerForConnect,
  syncAccountToDb,
  translateRequirementsList,
} from "@/lib/stripe-connect";

// Manual refresh rate limit — chrání Stripe API před zneužitím
// (partner může F5 spamovat status page). 60s je dost agresivní pro UX
// a zároveň chrání quota.
const REFRESH_RATE_LIMIT_MS = 60_000;

/**
 * GET /api/stripe/connect/status
 *
 * Vrátí onboarding state z DB. S `?refresh=1` refreshne ze Stripe API
 * (rate-limit 60s per partner přes stripeAccountUpdatedAt timestamp).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const resolved = await resolvePartnerForConnect(request, session);
    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status },
      );
    }
    let { partner } = resolved;

    const url = new URL(request.url);
    const shouldRefresh =
      url.searchParams.get("refresh") === "1" && !!partner.stripeAccountId;

    if (shouldRefresh) {
      const lastSync = partner.stripeAccountUpdatedAt?.getTime() ?? 0;
      if (Date.now() - lastSync >= REFRESH_RATE_LIMIT_MS) {
        const account = await getAccountStatus(partner.stripeAccountId!);
        partner = await syncAccountToDb(partner.id, account);
      }
    }

    const state = deriveOnboardingState(partner);

    return NextResponse.json({
      state,
      stripeAccountId: partner.stripeAccountId,
      detailsSubmitted: partner.stripeDetailsSubmitted,
      payoutsEnabled: partner.stripePayoutsEnabled,
      chargesEnabled: partner.stripeChargesEnabled,
      requirementsCurrentlyDue: partner.stripeRequirementsCurrentlyDue,
      requirementsCurrentlyDueCz: translateRequirementsList(
        partner.stripeRequirementsCurrentlyDue,
      ),
      disabledReason: partner.stripeDisabledReason,
      startedAt: partner.stripeOnboardingStartedAt?.toISOString() ?? null,
      completedAt: partner.stripeOnboardingCompletedAt?.toISOString() ?? null,
      updatedAt: partner.stripeAccountUpdatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("GET /api/stripe/connect/status error:", error);
    return NextResponse.json(
      {
        error: "stripe_error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

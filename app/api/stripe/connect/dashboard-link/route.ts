import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createDashboardLink,
  resolvePartnerForConnect,
} from "@/lib/stripe-connect";

/**
 * POST /api/stripe/connect/dashboard-link
 *
 * Generuje Express dashboard login link (magic link, expires ~1 min) pro
 * partnery kteří už dokončili onboarding — úprava bank account, stažení
 * statements, apod.
 */
export async function POST(request: NextRequest) {
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
    const { partner } = resolved;

    // Stripe login link vyžaduje dokončený onboarding, jinak vrací
    // `login_link_not_available`. Early return s jasnějším error kódem.
    if (!partner.stripeAccountId || !partner.stripePayoutsEnabled) {
      return NextResponse.json(
        { error: "not_onboarded" },
        { status: 400 },
      );
    }

    const link = await createDashboardLink(partner.stripeAccountId);

    return NextResponse.json({ url: link.url });
  } catch (error) {
    console.error("POST /api/stripe/connect/dashboard-link error:", error);
    return NextResponse.json(
      {
        error: "stripe_error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

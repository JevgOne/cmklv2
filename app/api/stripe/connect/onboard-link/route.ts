import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createOnboardingLink,
  createOrGetConnectAccount,
  resolvePartnerForConnect,
} from "@/lib/stripe-connect";

/**
 * POST /api/stripe/connect/onboard-link
 *
 * Generuje Stripe hosted onboarding URL. Pokud partner ještě nemá
 * stripeAccountId, eagerly vytvoří Express account. Dvě entry points:
 * PARTS_SUPPLIER self-service nebo ADMIN/BACKOFFICE přes `?partnerId=xxx`.
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
    const { partner, isAdmin } = resolved;

    if (!partner.email) {
      return NextResponse.json(
        { error: "partner_missing_email" },
        { status: 400 },
      );
    }

    const accountId = await createOrGetConnectAccount(partner);

    // Drop-off metric marker — natvrdo set při prvním POST.
    if (!partner.stripeOnboardingStartedAt) {
      await prisma.partner.update({
        where: { id: partner.id },
        data: { stripeOnboardingStartedAt: new Date() },
      });
    }

    const returnPath = isAdmin
      ? `/admin/partners/${partner.id}?stripe=return`
      : `/parts/profile?stripe=return`;
    const refreshPath = isAdmin
      ? `/admin/partners/${partner.id}?stripe=refresh`
      : `/parts/profile?stripe=refresh`;

    const link = await createOnboardingLink({
      accountId,
      returnPath,
      refreshPath,
    });

    return NextResponse.json({
      url: link.url,
      expiresAt: link.expires_at,
    });
  } catch (error) {
    console.error("POST /api/stripe/connect/onboard-link error:", error);
    return NextResponse.json(
      {
        error: "stripe_error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

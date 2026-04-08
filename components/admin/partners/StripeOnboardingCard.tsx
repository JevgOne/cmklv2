"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  deriveOnboardingState,
  mapStatusResponseToPartnerFields,
  translateRequirementsList,
  type OnboardingState,
  type StripeConnectStatusResponse,
  type StripePartnerFields,
} from "@/lib/stripe-connect-shared";
import { formatRelativeCz } from "@/lib/utils";
import { StripeStatusBadge } from "@/components/ui/StripeStatusBadge";

interface StripeOnboardingCardProps {
  partner: StripePartnerFields & { id: string };
  canEdit: boolean;
  onRefresh: (updated: Partial<StripePartnerFields>) => void;
}

const STATE_COPY: Record<OnboardingState, { body: string }> = {
  not_started: {
    body: "Výplaty provizních splitů jdou zatím manuálně bankovním převodem. Snapshot v OrderItem je zdrojem pravdy pro finance team. Zkopíruj partnerovi onboarding link a pošli ho přes email nebo Slack.",
  },
  in_progress: {
    body: "Partner zahájil onboarding a Stripe ověřuje jeho údaje. Obvykle to trvá 1–2 dny. Můžeš partnerovi poslat refresh link pokud by chtěl pokračovat.",
  },
  complete: {
    body: "Stripe Connect účet je plně aktivní. Provize se partnerovi posílají automaticky při checkoutu objednávky.",
  },
  action_required: {
    body: "Stripe potřebuje od partnera dodatečné informace. Pošli mu refresh link, aby mohl doplnit požadovaná pole.",
  },
  disabled: {
    body: "Stripe account je deaktivovaný. Eskaluj finance týmu před dalšími transakcemi — automatické transfery jsou pozastavené.",
  },
};

type Feedback = { kind: "ok" | "err"; message: string };

export function StripeOnboardingCard({
  partner,
  canEdit,
  onRefresh,
}: StripeOnboardingCardProps) {
  const [busy, setBusy] = useState<null | "copy" | "sync">(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const state = useMemo<OnboardingState>(
    () => deriveOnboardingState(partner),
    [partner],
  );
  const requirementsCz = useMemo(
    () => translateRequirementsList(partner.stripeRequirementsCurrentlyDue),
    [partner.stripeRequirementsCurrentlyDue],
  );

  const copy = STATE_COPY[state];
  const showCopyLink =
    canEdit &&
    (state === "not_started" ||
      state === "in_progress" ||
      state === "action_required");
  const showSync = canEdit && state !== "not_started";

  async function fetchAndPropagate(refresh: boolean): Promise<void> {
    const res = await fetch(
      `/api/stripe/connect/status?partnerId=${partner.id}${refresh ? "&refresh=1" : ""}`,
    );
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error ?? "stripe_error");
    }
    const data = (await res.json()) as StripeConnectStatusResponse;
    onRefresh(mapStatusResponseToPartnerFields(data));
  }

  async function handleCopyOnboardingLink() {
    setBusy("copy");
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/stripe/connect/onboard-link?partnerId=${partner.id}`,
        { method: "POST" },
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "stripe_error");
      }
      const { url } = (await res.json()) as { url: string };
      await navigator.clipboard.writeText(url);
      setFeedback({ kind: "ok", message: "Link zkopírován do schránky" });
      // Cheap DB read bez Stripe API roundtripu — propaguje čerstvě
      // vytvořený stripeAccountId + stripeOnboardingStartedAt do UI.
      await fetchAndPropagate(false).catch((err) => {
        console.error("silent status fetch failed:", err);
      });
    } catch (err) {
      console.error("copy onboarding link failed:", err);
      setFeedback({
        kind: "err",
        message:
          err instanceof Error
            ? err.message
            : "Nepodařilo se získat onboarding link",
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleSync() {
    setBusy("sync");
    setFeedback(null);
    try {
      await fetchAndPropagate(true);
      setFeedback({ kind: "ok", message: "Stav synchronizován ze Stripe" });
    } catch (err) {
      console.error("stripe sync failed:", err);
      setFeedback({
        kind: "err",
        message: err instanceof Error ? err.message : "Sync ze Stripe selhal",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Stripe Connect (výplaty)
        </h3>
        <StripeStatusBadge state={state} />
      </div>

      <p className="text-sm text-gray-600">{copy.body}</p>

      {state === "complete" && (
        <ul className="mt-4 space-y-1 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Údaje odeslány
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            Výplaty povoleny
          </li>
          <li className="flex items-center gap-2">
            <span
              className={
                partner.stripeChargesEnabled ? "text-green-600" : "text-gray-400"
              }
            >
              {partner.stripeChargesEnabled ? "✓" : "–"}
            </span>
            Platby povoleny
          </li>
        </ul>
      )}

      {state === "action_required" && requirementsCz.length > 0 && (
        <div className="mt-4">
          <div className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Stripe potřebuje:
          </div>
          <ul className="space-y-1 text-sm text-gray-700">
            {requirementsCz.map((label) => (
              <li key={label} className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {state === "disabled" && partner.stripeDisabledReason && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          Důvod: <code>{partner.stripeDisabledReason}</code>
        </div>
      )}

      {partner.stripeAccountId && (
        <div className="mt-4 text-xs text-gray-500 space-y-0.5">
          <div>
            Stripe Account:{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded">
              {partner.stripeAccountId}
            </code>
          </div>
          <div>
            Naposledy synchronizováno:{" "}
            {formatRelativeCz(partner.stripeAccountUpdatedAt)}
          </div>
        </div>
      )}

      {(showCopyLink || showSync) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {showCopyLink && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyOnboardingLink}
              disabled={busy !== null}
            >
              {busy === "copy"
                ? "Připravuji link..."
                : state === "not_started"
                  ? "Zkopírovat onboarding link"
                  : "Zkopírovat refresh link"}
            </Button>
          )}
          {showSync && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={busy !== null}
            >
              {busy === "sync" ? "Synchronizuji..." : "Sync ze Stripe"}
            </Button>
          )}
        </div>
      )}

      {feedback && (
        <div
          className={`mt-3 text-xs font-medium ${
            feedback.kind === "ok" ? "text-green-700" : "text-error-500"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </Card>
  );
}

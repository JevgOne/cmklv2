"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StripeStatusBadge } from "@/components/ui/StripeStatusBadge";
import {
  deriveOnboardingState,
  mapStatusResponseToPartnerFields,
  translateRequirementsList,
  type OnboardingState,
  type StripeConnectStatusResponse,
  type StripePartnerFields,
} from "@/lib/stripe-connect-shared";
import { formatRelativeCz } from "@/lib/utils";

const STATE_COPY: Record<
  OnboardingState,
  { headline: string; body: string; cta: string }
> = {
  not_started: {
    headline: "Rychlejší výplaty se Stripe",
    body: "Napoj svůj bankovní účet přes Stripe a dostávej peníze za prodané díly automaticky, do pár dní po objednávce. Onboarding otevře prohlížeč — po dokončení se vrátíš sem sám.",
    cta: "Napoj Stripe účet",
  },
  in_progress: {
    headline: "Stripe zpracovává tvé údaje",
    body: "Obvykle to trvá 1–2 dny. Pokud chceš něco upravit, pokračuj v onboardingu. Po dokončení se vrátíš sem.",
    cta: "Dokončit onboarding",
  },
  action_required: {
    headline: "Stripe potřebuje dodatečné informace",
    body: "Pro dokončení napojení nám Stripe potřebuje doplnit pár údajů. Onboarding otevře prohlížeč — po dokončení se vrátíš sem sám.",
    cta: "Dokončit onboarding",
  },
  complete: {
    headline: "Výplaty jsou aktivní",
    body: "Tvůj účet je plně propojen. Stripe ti automaticky posílá peníze za prodané díly podle standardního payout plánu.",
    cta: "Upravit údaje ve Stripe",
  },
  disabled: {
    headline: "Napojení je deaktivované",
    body: "Stripe tvůj účet dočasně zablokoval. Podívej se na důvod níže a ozvi se nám na podporu — pomůžeme ti to vyřešit.",
    cta: "Obnovit onboarding",
  },
};

type Feedback = { kind: "ok" | "err"; message: string };
type BusyAction = "link" | "dashboard";

async function fetchConnectStatus(refresh: boolean): Promise<StripePartnerFields> {
  const res = await fetch(
    `/api/stripe/connect/status${refresh ? "?refresh=1" : ""}`,
  );
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error ?? "stripe_error");
  }
  const data = (await res.json()) as StripeConnectStatusResponse;
  return mapStatusResponseToPartnerFields(data);
}

export function SupplierStripeCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [partner, setPartner] = useState<StripePartnerFields | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<BusyAction | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    const isReturn = stripeParam === "return";
    const isRefresh = stripeParam === "refresh";
    let ignore = false;

    async function init() {
      try {
        // Return/refresh z Stripe → vynucený sync přes Stripe API, jinak
        // cheap DB read stačí (partner jen otevírá profil).
        const updated = await fetchConnectStatus(isReturn || isRefresh);
        if (ignore) return;
        setPartner(updated);
        if (isReturn) {
          const newState = deriveOnboardingState(updated);
          if (newState === "complete") {
            setFeedback({
              kind: "ok",
              message: "Stripe účet propojen, výplaty aktivní!",
            });
          } else if (newState === "action_required") {
            setFeedback({
              kind: "ok",
              message:
                "Pokračuj v dokončení — Stripe ještě potřebuje pár údajů.",
            });
          } else {
            setFeedback({
              kind: "ok",
              message: "Stripe zpracovává tvé údaje, dej mu chvilku.",
            });
          }
        }
        if (isReturn || isRefresh) {
          // Query wipe jen po úspěšném loadu — při chybě necháme `?stripe=return`
          // aby partner mohl stránku načíst znovu a spustit refresh flow.
          router.replace("/parts/profile");
        }
      } catch (err) {
        if (ignore) return;
        console.error("stripe status load failed:", err);
        setFeedback({
          kind: "err",
          message:
            err instanceof Error ? err.message : "Nepodařilo se načíst stav",
        });
      } finally {
        if (!ignore) setLoaded(true);
      }
    }

    init();
    return () => {
      ignore = true;
    };
    // Mount-only: změny searchParams během pobytu na stránce ignorujeme,
    // aby se return flow nezopakoval při navigaci v rámci stránky.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStartOnboarding() {
    setBusy("link");
    setFeedback(null);
    try {
      const res = await fetch("/api/stripe/connect/onboard-link", {
        method: "POST",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "stripe_error");
      }
      const { url } = (await res.json()) as { url: string };
      // Busy zůstává aktivní — browser už přesměrovává, clear by způsobil flash.
      window.location.href = url;
    } catch (err) {
      console.error("stripe onboard-link failed:", err);
      setFeedback({
        kind: "err",
        message:
          err instanceof Error
            ? err.message
            : "Nepodařilo se získat onboarding link",
      });
      setBusy(null);
    }
  }

  async function handleOpenDashboard() {
    setBusy("dashboard");
    setFeedback(null);
    try {
      const res = await fetch("/api/stripe/connect/dashboard-link", {
        method: "POST",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "stripe_error");
      }
      const { url } = (await res.json()) as { url: string };
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("stripe dashboard-link failed:", err);
      setFeedback({
        kind: "err",
        message:
          err instanceof Error
            ? err.message
            : "Nepodařilo se otevřít Stripe dashboard",
      });
    } finally {
      setBusy(null);
    }
  }

  if (!loaded) {
    return (
      <Card className="p-4">
        <div className="h-24 animate-pulse bg-gray-100 rounded-lg" />
      </Card>
    );
  }

  if (!partner) {
    return (
      <Card className="p-4">
        <h3 className="text-base font-bold text-gray-900 mb-1">
          Stripe Connect
        </h3>
        <p className="text-sm text-gray-600">
          {feedback?.kind === "err"
            ? feedback.message
            : "Stav se nepodařilo načíst. Zkus to prosím znovu později."}
        </p>
      </Card>
    );
  }

  const state = deriveOnboardingState(partner);
  const requirementsCz = translateRequirementsList(
    partner.stripeRequirementsCurrentlyDue,
  );
  const copy = STATE_COPY[state];
  const primaryAction =
    state === "complete" ? handleOpenDashboard : handleStartOnboarding;
  const primaryLabel =
    busy === "link"
      ? "Připravuji onboarding..."
      : busy === "dashboard"
        ? "Otevírám Stripe..."
        : copy.cta;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-gray-900">{copy.headline}</h3>
        <StripeStatusBadge state={state} />
      </div>

      <p className="text-sm text-gray-600">{copy.body}</p>

      {state === "action_required" && requirementsCz.length > 0 && (
        <div>
          <div className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
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
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          Důvod:{" "}
          <code className="text-[12px]">{partner.stripeDisabledReason}</code>
        </div>
      )}

      {partner.stripeAccountId && (
        <div className="text-xs text-gray-500">
          Naposledy synchronizováno:{" "}
          {formatRelativeCz(partner.stripeAccountUpdatedAt)}
        </div>
      )}

      <Button
        variant="primary"
        size="sm"
        className="w-full bg-gradient-to-br from-green-500 to-green-600"
        onClick={primaryAction}
        disabled={busy !== null}
      >
        {primaryLabel}
      </Button>

      {feedback && (
        <div
          className={`text-xs font-medium ${
            feedback.kind === "ok" ? "text-green-700" : "text-red-600"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </Card>
  );
}

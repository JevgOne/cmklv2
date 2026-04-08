import { Badge, type BadgeProps } from "@/components/ui/Badge";
import type { OnboardingState } from "@/lib/stripe-connect-shared";

interface StripeStatusBadgeProps {
  state: OnboardingState;
  className?: string;
}

const STATE_CONFIG: Record<
  OnboardingState,
  { variant: NonNullable<BadgeProps["variant"]>; icon: string | null; label: string }
> = {
  not_started: { variant: "default", icon: null, label: "Nepřipojeno" },
  in_progress: { variant: "new", icon: "⏳", label: "Stripe zpracovává" },
  complete: { variant: "success", icon: "✓", label: "Výplaty aktivní" },
  action_required: { variant: "warning", icon: "⚠", label: "Vyžaduje akci" },
  disabled: { variant: "destructive", icon: "✕", label: "Zakázáno" },
};

export function StripeStatusBadge({ state, className }: StripeStatusBadgeProps) {
  const config = STATE_CONFIG[state];
  return (
    <Badge variant={config.variant} className={className}>
      {config.icon && <span aria-hidden="true">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}

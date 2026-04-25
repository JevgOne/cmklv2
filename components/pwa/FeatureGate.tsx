"use client";

import type { Feature } from "@/lib/feature-gates";
import { canAccess } from "@/lib/feature-gates";
import { LockedFeatureCard } from "./LockedFeatureCard";

interface FeatureGateProps {
  feature: Feature;
  userLevel: string;
  userRole?: string;
  percentage?: number;
  revenueNeeded?: number;
  compact?: boolean;
  fullscreen?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const BYPASS_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];

export function FeatureGate({
  feature,
  userLevel,
  userRole,
  percentage = 0,
  revenueNeeded = 0,
  compact = false,
  fullscreen = false,
  fallback,
  children,
}: FeatureGateProps) {
  if (userRole && BYPASS_ROLES.includes(userRole)) {
    return <>{children}</>;
  }

  if (canAccess(userLevel, feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <LockedFeatureCard
      feature={feature}
      percentage={percentage}
      revenueNeeded={revenueNeeded}
      compact={compact}
      fullscreen={fullscreen}
    />
  );
}

"use client";

import { AppTour } from "@/components/pwa/tour/AppTour";

interface DashboardTourWrapperProps {
  userName: string;
}

export function DashboardTourWrapper({ userName }: DashboardTourWrapperProps) {
  return <AppTour userName={userName} />;
}

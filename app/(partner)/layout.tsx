"use client";

import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { OnlineStatusProvider } from "@/components/pwa/OnlineStatusProvider";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";

export default function PartnerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <OnlineStatusProvider>
        <PartnerLayout>
          <OfflineBanner />
          {children}
        </PartnerLayout>
      </OnlineStatusProvider>
    </AuthProvider>
  );
}

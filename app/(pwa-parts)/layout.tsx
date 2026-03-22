"use client";

import { OnlineStatusProvider } from "@/components/pwa/OnlineStatusProvider";
import { SupplierTopBar } from "@/components/pwa-parts/SupplierTopBar";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { SupplierBottomNav } from "@/components/pwa-parts/SupplierBottomNav";

export default function PwaPartsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnlineStatusProvider>
      <div className="min-h-screen bg-gray-50">
        <SupplierTopBar />
        <div className="pt-[calc(56px+env(safe-area-inset-top))]">
          <OfflineBanner />
          <main className="pb-20">{children}</main>
        </div>
        <SupplierBottomNav />
      </div>
    </OnlineStatusProvider>
  );
}

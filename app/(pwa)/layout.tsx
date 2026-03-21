"use client";

import { OnlineStatusProvider } from "@/components/pwa/OnlineStatusProvider";
import { TopBar } from "@/components/pwa/TopBar";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { BottomNav } from "@/components/pwa/BottomNav";

export default function PwaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnlineStatusProvider>
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="pt-[calc(56px+env(safe-area-inset-top))]">
          <OfflineBanner />
          <main className="pb-20">{children}</main>
        </div>
        <BottomNav />
      </div>
    </OnlineStatusProvider>
  );
}

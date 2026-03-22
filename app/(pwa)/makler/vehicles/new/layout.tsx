"use client";

import { DraftProvider } from "@/lib/hooks/useDraft";

export default function NewVehicleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DraftProvider>
      {/* Vlastní navigace flow - překryje TopBar a BottomNav z parent layoutu */}
      <div className="fixed inset-0 z-[100] bg-white overflow-hidden">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </DraftProvider>
  );
}

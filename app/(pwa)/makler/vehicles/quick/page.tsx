"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";

export default function QuickVehiclePage() {
  const router = useRouter();
  const { createDraft } = useDraftContext();

  useEffect(() => {
    const init = async () => {
      const draftId = await createDraft();
      router.replace(`/makler/vehicles/quick/step1?draft=${draftId}`);
    };
    init();
  }, [createDraft, router]);

  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        <p className="text-sm text-gray-500">Připravuji rychlý draft...</p>
      </div>
    </div>
  );
}

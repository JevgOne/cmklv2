"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { QuickStep2 } from "@/components/pwa/vehicles/quick/QuickStep2";

export default function QuickStep2Page() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const { draft, loadDraft, loading } = useDraftContext();

  useEffect(() => {
    if (draftId && !draft) {
      loadDraft(draftId);
    }
  }, [draftId, draft, loadDraft]);

  if (loading || !draft) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <QuickStep2 />;
}

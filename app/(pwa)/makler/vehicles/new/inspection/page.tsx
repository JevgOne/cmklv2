"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { InspectionStep } from "@/components/pwa/vehicles/new/InspectionStep";
import { useDraftContext } from "@/lib/hooks/useDraft";

export default function InspectionPage() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const { draft, loadDraft, loading } = useDraftContext();

  useEffect(() => {
    if (draftId && !draft) {
      loadDraft(draftId);
    }
  }, [draftId, draft, loadDraft]);

  if (loading || (!draft && draftId)) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <InspectionStep />;
}

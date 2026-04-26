"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";

interface StepPageGuardProps {
  children: React.ReactNode;
}

export function StepPageGuard({ children }: StepPageGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const { draft, loadDraft, loading } = useDraftContext();

  useEffect(() => {
    if (!draftId) {
      router.replace("/makler/vehicles/new");
      return;
    }
    if (!draft) {
      loadDraft(draftId);
    }
  }, [draftId, draft, loadDraft, router]);

  if (!draftId || loading || !draft) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

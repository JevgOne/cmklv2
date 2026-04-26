"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { Button } from "@/components/ui/Button";

interface StepPageGuardProps {
  children: React.ReactNode;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function StepPageGuardInner({ children }: StepPageGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");
  const { draft, loadDraft, loading, error, createDraft } = useDraftContext();

  useEffect(() => {
    if (!draftId) {
      router.replace("/makler/vehicles/new");
      return;
    }
    if (!draft && !loading && !error) {
      loadDraft(draftId);
    }
  }, [draftId, draft, loadDraft, loading, error, router]);

  if (!draftId) {
    return <LoadingSpinner />;
  }

  // Draft loading failed — show recovery UI
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] gap-4 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-orange-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900">
          Draft nebyl nalezen
        </p>
        <p className="text-sm text-gray-500 max-w-xs">
          Rozpracovaný draft mohl být smazán nebo vypršela jeho platnost.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
          <Button
            variant="primary"
            className="w-full"
            onClick={async () => {
              const id = await createDraft();
              router.replace(`/makler/vehicles/new/vin?draft=${id}`);
            }}
          >
            Vytvořit nový draft
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/makler/vehicles/new")}
          >
            Zpět na přehled
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !draft) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}

export function StepPageGuard({ children }: StepPageGuardProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StepPageGuardInner>{children}</StepPageGuardInner>
    </Suspense>
  );
}

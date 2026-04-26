"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StepProgressBar } from "./StepProgressBar";
import { useDraftContext } from "@/lib/hooks/useDraft";

interface StepLayoutProps {
  step: number;
  title: string;
  children: React.ReactNode;
  onNext?: () => void | Promise<void>;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showSave?: boolean;
  totalSteps?: number;
}

export function StepLayout({
  step,
  title,
  children,
  onNext,
  onBack,
  nextLabel = "Pokračovat",
  nextDisabled = false,
  showSave = false,
  totalSteps = 8,
}: StepLayoutProps) {
  const router = useRouter();
  const { saveDraft } = useDraftContext();

  const handleClose = async () => {
    await saveDraft();
    router.push("/makler/dashboard");
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            {/* Šipka zpět */}
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Zpět"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>

            {/* Název kroku */}
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>

            {/* Křížek - zavřít a uložit */}
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Zavřít"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <StepProgressBar currentStep={step} totalSteps={totalSteps} />
        </div>
      </div>

      {/* Obsah */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {children}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="flex gap-3">
          {showSave && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={saveDraft}
            >
              Uložit draft
            </Button>
          )}
          {onNext && (
            <Button
              variant="primary"
              className="flex-1"
              onClick={onNext}
              disabled={nextDisabled}
            >
              {nextLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

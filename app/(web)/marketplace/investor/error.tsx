"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function InvestorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketplace investor error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          !
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
          Chyba při načítání
        </h2>
        <p className="text-gray-500 mb-6">
          Nepodařilo se načíst investiční přehled. Zkuste to prosím znovu.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-red-500 mb-4 font-mono">{error.message}</p>
        )}
        <Button variant="primary" onClick={reset}>
          Zkusit znovu
        </Button>
      </div>
    </div>
  );
}

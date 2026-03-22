"use client";

import { Button } from "@/components/ui/Button";

export default function MarketplaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          !
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
          Neco se pokazilo
        </h2>
        <p className="text-gray-500 mb-6">
          Omlouvame se, doslo k neocekavane chybe. Zkuste to prosim znovu.
        </p>
        <Button variant="primary" onClick={reset}>
          Zkusit znovu
        </Button>
      </div>
    </div>
  );
}

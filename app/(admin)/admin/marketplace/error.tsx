"use client";

import { Button } from "@/components/ui/Button";

export default function AdminMarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Chyba pri nacitani marketplace
      </h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        {error.message || "Neco se pokazilo. Zkuste to prosim znovu."}
      </p>
      <Button variant="primary" onClick={reset}>
        Zkusit znovu
      </Button>
    </div>
  );
}

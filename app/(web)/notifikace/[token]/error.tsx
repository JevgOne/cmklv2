"use client";

import { Button } from "@/components/ui/Button";

export default function SellerNotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20 px-4">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Chyba pri nacitani nastaveni
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

"use client";

import { Button } from "@/components/ui/Button";

export default function PaymentError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Chyba při načítání platby
        </h1>
        <p className="text-gray-500 mb-6">
          {error.message || "Nastala neočekávaná chyba. Zkuste to prosím znovu."}
        </p>
        <Button onClick={reset}>Zkusit znovu</Button>
      </div>
    </div>
  );
}

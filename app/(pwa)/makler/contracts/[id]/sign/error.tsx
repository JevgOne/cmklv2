"use client";

import { Button } from "@/components/ui/Button";

export default function SignContractError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Chyba při načítání podpisu
      </h2>
      <p className="text-gray-500 mb-6">Zkuste to prosím znovu.</p>
      <Button onClick={reset}>Zkusit znovu</Button>
    </div>
  );
}

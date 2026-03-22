"use client";

import { Button } from "@/components/ui/Button";

export default function ContractDetailError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-4 text-center py-16">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Chyba při načítání smlouvy
      </h2>
      <p className="text-gray-500 mb-6">Zkuste to prosím znovu.</p>
      <Button onClick={reset}>Zkusit znovu</Button>
    </div>
  );
}

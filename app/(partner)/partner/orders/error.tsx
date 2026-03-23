"use client";

import { Button } from "@/components/ui/Button";

export default function PartnerOrdersError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Chyba</h2>
      <p className="text-gray-500 mb-6">{error.message || "Něco se pokazilo."}</p>
      <Button variant="primary" onClick={reset}>Zkusit znovu</Button>
    </div>
  );
}

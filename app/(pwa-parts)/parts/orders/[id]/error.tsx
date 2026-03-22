"use client";

import { Button } from "@/components/ui/Button";

export default function OrderDetailError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Chyba</h2>
        <p className="text-gray-500 mb-6">Nepodařilo se načíst detail objednávky</p>
        <Button variant="primary" onClick={reset}>
          Zkusit znovu
        </Button>
      </div>
    </div>
  );
}

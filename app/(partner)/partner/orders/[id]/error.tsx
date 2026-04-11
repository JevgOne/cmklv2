"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function OrderDetailError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3">⚠️</div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Něco se pokazilo</h2>
      <p className="text-sm text-gray-500 mb-6">Nepodařilo se načíst detail objednávky.</p>
      <div className="flex gap-3 justify-center">
        <Button variant="primary" size="sm" onClick={reset}>Zkusit znovu</Button>
        <Link href="/partner/orders">
          <Button variant="outline" size="sm">Zpět na objednávky</Button>
        </Link>
      </div>
    </div>
  );
}

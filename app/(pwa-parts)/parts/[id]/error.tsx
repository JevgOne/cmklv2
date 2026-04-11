"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PartDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Něco se pokazilo</h2>
        <p className="text-sm text-gray-500 mb-6">
          Nepodařilo se načíst detail dílu.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" size="sm" onClick={reset}>
            Zkusit znovu
          </Button>
          <Link href="/parts/my">
            <Button variant="outline" size="sm">
              Zpět na díly
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

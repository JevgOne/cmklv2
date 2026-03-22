"use client";

import { Button } from "@/components/ui/Button";

export default function BrokerRegistrationError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-50">
            <svg className="h-8 w-8 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Chyba pri registraci</h2>
          <p className="mt-3 text-sm text-gray-500">
            Doslo k neocekavane chybe. Zkuste to prosim znovu.
          </p>
          <div className="mt-6">
            <Button variant="primary" onClick={reset}>
              Zkusit znovu
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

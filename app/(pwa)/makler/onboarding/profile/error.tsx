"use client";

import { Button } from "@/components/ui/Button";

export default function OnboardingProfileError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-50">
        <svg className="h-8 w-8 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900">Chyba</h2>
      <p className="mt-2 text-sm text-gray-500">Nepodarilo se nacist profil.</p>
      <div className="mt-4">
        <Button variant="primary" onClick={reset}>Zkusit znovu</Button>
      </div>
    </div>
  );
}

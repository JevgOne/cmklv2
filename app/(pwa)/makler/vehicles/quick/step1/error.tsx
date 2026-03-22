"use client";

import { Button } from "@/components/ui/Button";

export default function Step1Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 text-center">
      <h2 className="text-lg font-bold text-gray-900 mb-2">
        Něco se pokazilo
      </h2>
      <p className="text-sm text-gray-500 mb-4">{error.message}</p>
      <Button variant="primary" onClick={reset}>
        Zkusit znovu
      </Button>
    </div>
  );
}

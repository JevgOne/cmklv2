"use client";

import { Button } from "@/components/ui/Button";

export default function NewContactError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Chyba při přidávání kontaktu
      </h2>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        {error.message || "Něco se pokazilo. Zkuste to prosím znovu."}
      </p>
      <Button variant="primary" onClick={reset}>
        Zkusit znovu
      </Button>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/Button";

export default function DetailsError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 px-4 text-center">
      <p className="text-lg font-semibold text-gray-900">
        Nastala neočekávaná chyba
      </p>
      <p className="text-sm text-gray-500">
        Při načítání stránky údajů došlo k chybě.
      </p>
      <Button variant="primary" onClick={reset}>
        Zkusit znovu
      </Button>
    </div>
  );
}

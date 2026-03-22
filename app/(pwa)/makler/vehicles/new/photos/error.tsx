"use client";

import { Button } from "@/components/ui";

export default function PhotosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Něco se pokazilo
      </h2>
      <p className="text-gray-500 mb-6">{error.message}</p>
      <Button onClick={reset}>Zkusit znovu</Button>
    </div>
  );
}

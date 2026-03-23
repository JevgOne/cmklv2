"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ExportButton() {
  const [message, setMessage] = useState("");

  return (
    <div className="relative inline-block">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setMessage("Export dat bude brzy dostupný.");
          setTimeout(() => setMessage(""), 3000);
        }}
      >
        Export
      </Button>
      {message && (
        <div className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10">
          {message}
        </div>
      )}
    </div>
  );
}

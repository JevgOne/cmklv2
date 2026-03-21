"use client";

import { Button } from "@/components/ui/Button";

export function ExportButton() {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => alert("Export dat bude brzy dostupný.")}
    >
      Export
    </Button>
  );
}

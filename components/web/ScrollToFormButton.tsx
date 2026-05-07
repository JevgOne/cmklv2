"use client";

import { Button } from "@/components/ui/Button";

export function ScrollToFormButton() {
  return (
    <Button
      variant="primary"
      size="default"
      onClick={() => {
        const el = document.getElementById("kariera-form");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
    >
      Mám zájem
    </Button>
  );
}

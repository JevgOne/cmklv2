"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function AddToCartButton() {
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <Button
      variant={added ? "success" : "primary"}
      size="lg"
      className="w-full"
      onClick={handleClick}
    >
      {added ? "✓ Přidáno do košíku" : "Přidat do košíku"}
    </Button>
  );
}

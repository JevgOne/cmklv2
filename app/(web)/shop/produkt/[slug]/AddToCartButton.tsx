"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { addToCart } from "@/lib/cart";

interface AddToCartButtonProps {
  partId: string;
  name: string;
  price: number;
  slug: string;
  image: string | null;
  stock: number;
  supplierId?: string;
  supplierName?: string;
}

export function AddToCartButton({
  partId,
  name,
  price,
  slug,
  image,
  stock,
  supplierId,
  supplierName,
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    addToCart({
      id: partId,
      name,
      price,
      slug,
      image: image ?? undefined,
      stock,
      supplierId,
      supplierName,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <Button
      variant={added ? "success" : "primary"}
      size="lg"
      className="w-full"
      onClick={handleClick}
      disabled={stock <= 0}
    >
      {stock <= 0
        ? "Vyprodáno"
        : added
          ? "✓ Přidáno do košíku"
          : "Přidat do košíku"}
    </Button>
  );
}

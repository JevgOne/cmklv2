"use client";

import { useState, memo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { addToCart } from "@/lib/cart";
import Link from "next/link";

export interface ProductCardProps {
  partId?: string;
  name: string;
  compatibility: string;
  condition?: number;
  price: number;
  oldPrice?: number;
  badge: "used" | "new" | "sale" | "aftermarket";
  image?: string;
  slug?: string;
  stock?: number;
  basePath?: string;
  supplierId?: string;
  supplierName?: string;
}

const badgeConfig = {
  used: { label: "Použitý", bg: "bg-gray-200 text-gray-700" },
  new: { label: "Nový díl", bg: "bg-green-100 text-green-700" },
  aftermarket: { label: "Aftermarket", bg: "bg-blue-100 text-blue-700" },
  sale: { label: "-25%", bg: "bg-red-100 text-red-600" },
};

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= count ? "text-orange-400" : "text-gray-200"}
        >
          ★
        </span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{count}/5</span>
    </div>
  );
}

function formatCzk(price: number): string {
  return new Intl.NumberFormat("cs-CZ").format(price);
}

export const ProductCard = memo(function ProductCard({
  partId,
  name,
  compatibility,
  condition,
  price,
  oldPrice,
  badge,
  image,
  slug,
  stock,
  basePath = "/shop",
  supplierId,
  supplierName,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const cfg = badgeConfig[badge];
  const href = slug
    ? basePath === "/dily" ? `${basePath}/${slug}` : `${basePath}/produkt/${slug}`
    : `${basePath}/katalog`;

  return (
    <Card hover className="group flex flex-col">
      {/* Image area */}
      <Link href={href} className="block no-underline">
        <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <span className="text-5xl text-gray-300">🔧</span>
          )}
          {/* Badge */}
          <span
            className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg}`}
          >
            {cfg.label}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={href} className="no-underline">
          <h3 className="font-bold text-gray-900 text-[15px] leading-tight line-clamp-2">
            {name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mt-1">{compatibility}</p>

        {/* Condition stars (used parts only) */}
        {condition !== undefined && (
          <div className="mt-2">
            <Stars count={condition} />
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-gray-900">
              {formatCzk(price)} Kč
            </span>
            {oldPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatCzk(oldPrice)} Kč
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <Button
          variant={added ? "success" : "primary"}
          size="sm"
          className="w-full mt-3"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (partId) {
              addToCart({
                id: partId,
                name,
                price,
                slug: slug ?? "",
                image: image ?? undefined,
                stock: stock ?? 1,
                supplierId,
                supplierName,
              });
            }
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
          }}
        >
          {added ? "✓ Přidáno" : "Do košíku"}
        </Button>
      </div>
    </Card>
  );
});

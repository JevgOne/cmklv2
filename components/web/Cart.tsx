"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  getCart,
  removeFromCart,
  updateQuantity,
  getCartTotal,
  onCartChange,
  type CartItem,
} from "@/lib/cart";
import { formatPrice } from "@/lib/utils";

export function Cart({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setItems(getCart());
      setTotal(getCartTotal());
    };
    refresh();
    return onCartChange(refresh);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Košík ({items.length})
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-gray-100 rounded-[10px] flex items-center justify-center cursor-pointer text-lg hover:bg-gray-200 transition-colors border-none"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🛒</div>
              <p className="text-gray-500 font-medium">Košík je prázdný</p>
              <p className="text-sm text-gray-500 mt-1">
                Přidejte díly z katalogu
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 bg-gray-50 rounded-xl p-3"
              >
                {/* Image placeholder */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl text-gray-400">🔧</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {item.name}
                  </h4>
                  <p className="text-sm font-bold text-orange-500 mt-0.5">
                    {formatPrice(item.price)}
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors self-start p-1 bg-transparent border-none cursor-pointer"
                  aria-label="Odebrat"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Celkem</span>
              <span className="text-xl font-extrabold text-gray-900">
                {formatPrice(total)}
              </span>
            </div>
            <Link href="/shop/objednavka" className="block no-underline" onClick={onClose}>
              <Button variant="primary" size="lg" className="w-full">
                Pokračovat k objednávce
              </Button>
            </Link>
            <Link href="/shop/kosik" className="block no-underline" onClick={onClose}>
              <Button variant="outline" size="sm" className="w-full">
                Zobrazit košík
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

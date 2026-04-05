"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getCart,
  removeFromCart,
  updateQuantity,
  getCartTotal,
  clearCart,
  onCartChange,
  type CartItem,
} from "@/lib/cart";
import { formatPrice } from "@/lib/utils";

export default function DilyKosikPage() {
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <EmptyState
            icon="🛒"
            title="Košík je prázdný"
            description="Prozkoumejte náš katalog a přidejte díly do košíku"
            actionLabel="Procházet katalog"
            onAction={() => (window.location.href = "/dily/katalog")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Košík</h1>
          <p className="text-gray-500 mt-1">
            {items.length} {items.length === 1 ? "položka" : items.length < 5 ? "položky" : "položek"}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover rounded-xl" sizes="80px" />
                    ) : (
                      <span className="text-3xl text-gray-300">🔧</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={item.slug ? `/dily/${item.slug}` : "/dily/katalog"}
                      className="font-semibold text-gray-900 hover:text-orange-500 transition-colors no-underline"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-sm font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-sm font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-gray-500">{formatPrice(item.price)} / ks</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors self-start p-1 bg-transparent border-none cursor-pointer"
                    aria-label="Odebrat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
            <button
              onClick={clearCart}
              className="text-sm text-red-500 font-medium hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none"
            >
              Vysypat košík
            </button>
          </div>

          <div>
            <Card className="p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Souhrn objednávky</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mezisoučet</span>
                  <span className="font-medium">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Doprava</span>
                  <span className="font-medium text-gray-500">dle výběru</span>
                </div>
              </div>
              <hr className="my-4 border-gray-200" />
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-900">Celkem</span>
                <span className="text-2xl font-extrabold text-gray-900">{formatPrice(total)}</span>
              </div>
              <Link href="/dily/objednavka" className="block no-underline">
                <Button variant="primary" size="lg" className="w-full">
                  Pokračovat k objednávce
                </Button>
              </Link>
              <Link
                href="/dily/katalog"
                className="block text-center text-sm text-orange-500 font-semibold mt-3 hover:text-orange-600 no-underline"
              >
                Pokračovat v nákupu
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

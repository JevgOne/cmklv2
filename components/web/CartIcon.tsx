"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCartCount, onCartChange } from "@/lib/cart";

export function CartIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getCartCount());
    return onCartChange(() => setCount(getCartCount()));
  }, []);

  return (
    <Link
      href="/shop/kosik"
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors no-underline"
      aria-label="Košík"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

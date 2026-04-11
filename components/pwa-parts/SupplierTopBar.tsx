"use client";

import { useState, useCallback } from "react";
import { useOnlineStatusContext } from "@/components/pwa/OnlineStatusProvider";
import { SearchOverlay } from "@/components/ui/SearchOverlay";

export function SupplierTopBar() {
  const { isOnline } = useOnlineStatusContext();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    const res = await fetch(`/api/partner/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return [
      { key: "parts", label: "Dily", icon: "🔧", results: (data.parts || []).map((p: { id: string; name: string; category: string; price: number }) => ({
        id: p.id, title: p.name, subtitle: p.category, href: `/parts/${p.id}`,
      }))},
      { key: "orders", label: "Objednavky", icon: "📦", results: (data.orders || []).map((o: { id: string; orderNumber: string; status: string }) => ({
        id: o.id, title: `#${o.orderNumber}`, subtitle: o.status, href: `/parts/orders/${o.id}`,
      }))},
    ];
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            Car<span className="text-orange-500">Makléř</span>
          </span>
          <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
            Díly
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search button */}
          <button onClick={() => setSearchOpen(true)} className="p-1 text-gray-600 bg-transparent border-none cursor-pointer" aria-label="Hledat">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>

          {/* Online/offline indicator */}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-500">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          {/* Notifications */}
          <button className="relative p-1 text-gray-600 bg-transparent border-none cursor-pointer" aria-label="Notifikace">
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
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              2
            </span>
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={handleSearch}
        placeholder="Hledat dily, objednavky..."
      />
    </header>
  );
}

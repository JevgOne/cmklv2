"use client";

import { NotificationBell } from "@/components/admin/NotificationBell";

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 h-[72px] z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Search bar */}
      <div className="flex items-center gap-3 bg-gray-100 px-4 py-2.5 rounded-full w-full max-w-[200px] sm:max-w-[320px]">
        <svg
          className="w-4 h-4 text-gray-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Hledat vozidla, makléře..."
          className="border-none bg-transparent text-sm w-full outline-none placeholder:text-gray-400"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <NotificationBell />

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors lg:hidden border-none"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

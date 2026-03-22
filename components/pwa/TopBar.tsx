"use client";

import { useState } from "react";
import Link from "next/link";
import { useOnlineStatusContext } from "./OnlineStatusProvider";
import { GlobalSearch } from "./GlobalSearch";

export function TopBar() {
  const { isOnline } = useOnlineStatusContext();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          {/* Menu — navigace do nastaveni */}
          <Link href="/makler/settings" className="p-2 -ml-2 text-gray-600" aria-label="Menu">
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
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              Car<span className="text-orange-500">Makler</span>
            </span>
            <span className="text-[10px] font-medium text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
              Pro
            </span>
          </div>

          {/* Right side: search + online status + notifications + avatar */}
          <div className="flex items-center gap-3">
            {/* Online/offline indicator */}
            <div
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-green-500" : "bg-red-500"
              }`}
              title={isOnline ? "Online" : "Offline"}
            />

            {/* Search */}
            <button
              className="p-1 text-gray-600"
              aria-label="Vyhledavani"
              onClick={() => setSearchOpen(true)}
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
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>

            {/* Notifications */}
            <Link href="/makler/settings/notifications" className="relative p-1 text-gray-600" aria-label="Notifikace">
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
            </Link>

            {/* Avatar — navigace do profilu */}
            <Link href="/makler/profile" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center" aria-label="Profil">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

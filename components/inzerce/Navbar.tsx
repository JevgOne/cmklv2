"use client";

import { useState } from "react";
import Link from "next/link";
import { urls } from "@/lib/urls";

export function InzerceNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
          <img src="/brand/logo-color.png" alt="CarMakléř" className="h-10 sm:h-12" />
          <span className="text-sm font-semibold text-orange-500 border border-orange-200 rounded-full px-2 py-0.5">
            Inzerce
          </span>
        </Link>

        {/* Nav Links - desktop */}
        <div className="hidden lg:flex items-center gap-1">
          <Link
            href="/katalog"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors no-underline px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Katalog
          </Link>
          <Link
            href="/pridat"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors no-underline px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Přidat inzerát
          </Link>
          <a
            href={urls.main("/moje-inzeraty")}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors no-underline px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Moje inzeráty
          </a>
        </div>

        {/* CTA - desktop */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <a
            href={urls.main("/")}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors no-underline px-3 py-2"
          >
            carmakler.cz
          </a>
          <a
            href={urls.main("/login")}
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-full border-none cursor-pointer transition-all duration-200 whitespace-nowrap py-2 px-4 text-[13px] bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange hover:-translate-y-0.5 hover:shadow-orange-hover no-underline"
          >
            Přihlásit se
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden flex flex-col items-center justify-center gap-[5px] w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg bg-transparent border-none cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Zavřít menu" : "Otevřít menu"}
        >
          {isOpen ? (
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <span className="block w-5 h-[2px] bg-gray-700 rounded-full" />
              <span className="block w-5 h-[2px] bg-gray-700 rounded-full" />
              <span className="block w-5 h-[2px] bg-gray-700 rounded-full" />
            </>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 pb-4">
          <Link
            href="/katalog"
            className="block text-base font-medium text-gray-900 hover:text-orange-500 py-3 no-underline border-b border-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Katalog
          </Link>
          <Link
            href="/pridat"
            className="block text-base font-medium text-gray-900 hover:text-orange-500 py-3 no-underline border-b border-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Přidat inzerát
          </Link>
          <a
            href={urls.main("/moje-inzeraty")}
            className="block text-base font-medium text-gray-900 hover:text-orange-500 py-3 no-underline border-b border-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Moje inzeráty
          </a>
          <a
            href={urls.main("/")}
            className="block text-base font-medium text-gray-500 hover:text-orange-500 py-3 no-underline border-b border-gray-100"
            onClick={() => setIsOpen(false)}
          >
            carmakler.cz
          </a>
          <div className="pt-3">
            <a
              href={urls.main("/login")}
              className="block w-full text-center font-semibold rounded-full py-2.5 px-4 text-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white no-underline"
            >
              Přihlásit se
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

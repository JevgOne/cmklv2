"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

const serviceItems = [
  { href: "/sluzby/proverka", title: "Prověrka vozidla" },
  { href: "/sluzby/financovani", title: "Financování" },
  { href: "/sluzby/pojisteni", title: "Pojištění" },
  { href: "/sluzby/vykup", title: "Výkup vozidel" },
];

const aboutItems = [
  { href: "/o-nas", title: "O CarMakléř" },
  { href: "/o-nas", title: "Náš tým" },
  { href: "/kariera", title: "Kariéra" },
  { href: "/recenze", title: "Recenze" },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setOpenSection(null);
  };

  return (
    <>
      {/* Hamburger button - visible only on mobile */}
      <button
        type="button"
        className="lg:hidden flex flex-col items-center justify-center gap-[5px] w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg bg-transparent border-none cursor-pointer"
        onClick={() => setIsOpen(true)}
        aria-label="Otevřít menu"
      >
        <span className="block w-5 h-[2px] bg-gray-700 rounded-full transition-all" />
        <span className="block w-5 h-[2px] bg-gray-700 rounded-full transition-all" />
        <span className="block w-5 h-[2px] bg-gray-700 rounded-full transition-all" />
      </button>

      {/* Full-screen overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          {/* Header with close button */}
          <div className="flex items-center justify-between px-4 sm:px-6 h-[72px] border-b border-gray-200">
            <Link
              href="/"
              className="flex items-center no-underline"
              onClick={closeMenu}
            >
              <img src="/brand/logo-color.png" alt="CarMakléř" className="h-12 sm:h-14" />
            </Link>
            <button
              type="button"
              className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg bg-transparent border-none cursor-pointer text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={closeMenu}
              aria-label="Zavřít menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-6 pt-6">
            {/* Nabídka vozidel */}
            <Link
              href="/nabidka"
              className="flex items-center text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors py-4 border-b border-gray-100 no-underline min-h-[44px]"
              onClick={closeMenu}
            >
              Nabídka vozidel
            </Link>

            {/* Inzerce */}
            <Link
              href="/inzerce"
              className="flex items-center text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors py-4 border-b border-gray-100 no-underline"
              onClick={closeMenu}
            >
              Inzerce
            </Link>

            {/* Shop */}
            <Link
              href="/shop"
              className="flex items-center text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors py-4 border-b border-gray-100 no-underline"
              onClick={closeMenu}
            >
              Shop
            </Link>

            {/* Služby - expandable */}
            <div className="border-b border-gray-100">
              <button
                type="button"
                className="flex items-center justify-between w-full text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors py-4 bg-transparent border-none cursor-pointer text-left"
                onClick={() => toggleSection("sluzby")}
              >
                <span>Služby</span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSection === "sluzby" ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {openSection === "sluzby" && (
                <div className="pl-4 pb-3">
                  {serviceItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="block text-base text-gray-600 hover:text-orange-500 transition-colors py-2.5 no-underline"
                      onClick={closeMenu}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* O nás - expandable */}
            <div className="border-b border-gray-100">
              <button
                type="button"
                className="flex items-center justify-between w-full text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors py-4 bg-transparent border-none cursor-pointer text-left"
                onClick={() => toggleSection("onas")}
              >
                <span>O nás</span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSection === "onas" ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {openSection === "onas" && (
                <div className="pl-4 pb-3">
                  {aboutItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="block text-base text-gray-600 hover:text-orange-500 transition-colors py-2.5 no-underline"
                      onClick={closeMenu}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* CTA Buttons at bottom */}
          <div className="flex flex-col gap-3 px-6 pb-8 pt-4 border-t border-gray-100">
            <Link href="/chci-prodat" className="no-underline" onClick={closeMenu}>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
              >
                Chci prodat auto
              </Button>
            </Link>
            <Link href="/nabidka" className="no-underline" onClick={closeMenu}>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
              >
                Chci koupit auto
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

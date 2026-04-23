"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button, PlatformSwitcher } from "@/components/ui";
import { MobileAuthSection } from "@/components/ui/AuthButton";

const serviceItems = [
  { href: "/sluzby/proverka", title: "Prověrka vozidla" },
  { href: "/sluzby/financovani", title: "Financování" },
  { href: "/sluzby/pojisteni", title: "Pojištění" },
  { href: "/jak-prodat-auto", title: "Jak prodat auto" },
];

const aboutItems = [
  { href: "/o-nas", title: "O CarMakléři" },
  { href: "/makleri", title: "Naši makléři" },
  { href: "/jak-to-funguje", title: "Jak to funguje" },
  { href: "/recenze", title: "Recenze" },
  { href: "/kariera", title: "Kariéra" },
  { href: "/kontakt", title: "Kontakt" },
  { href: "/registrace/partner", title: "Registrace pro partnery" },
];

export function MainMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setOpenSection(null);
  };

  const menuOverlay = isOpen ? (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col" style={{ height: '100dvh' }}>
      <div className="flex items-center justify-between px-4 sm:px-6 h-[72px] border-b border-gray-200 shrink-0">
        <Link href="/" className="flex items-center no-underline" onClick={closeMenu}>
          <Image src="/brand/logo-dark.png" alt="CarMakléř" width={180} height={86} className="h-10 sm:h-12 w-auto object-contain" priority />
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

      <nav aria-label="Mobilni menu" className="flex-1 overflow-y-auto px-6 pt-6 min-h-0">
        <Link
          href="/nabidka"
          className="flex items-center text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors py-4 border-b border-gray-100 no-underline min-h-[44px]"
          onClick={closeMenu}
        >
          Nabídka vozidel
        </Link>

        <Link
          href="/makleri"
          className="flex items-center text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors py-4 border-b border-gray-100 no-underline min-h-[44px]"
          onClick={closeMenu}
        >
          Naši makléři
        </Link>

        <PlatformSwitcher
          current="main"
          variant="navbar-mobile"
          hideCurrent
          onLinkClick={closeMenu}
        />

        <div className="border-b border-gray-100">
          <button
            type="button"
            className="flex items-center justify-between w-full text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors py-4 bg-transparent border-none cursor-pointer text-left min-h-[44px]"
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

        <div className="border-b border-gray-100">
          <button
            type="button"
            className="flex items-center justify-between w-full text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors py-4 bg-transparent border-none cursor-pointer text-left min-h-[44px]"
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

      <div className="flex flex-col gap-3 px-6 pb-8 pt-4 border-t border-gray-100 shrink-0">
        <MobileAuthSection onNavigate={closeMenu} />
        <Link href="/chci-prodat" className="no-underline" onClick={closeMenu}>
          <Button variant="outline" size="lg" className="w-full">
            Chci prodat auto
          </Button>
        </Link>
        <Link href="/nabidka" className="no-underline" onClick={closeMenu}>
          <Button variant="primary" size="lg" className="w-full">
            Chci koupit auto
          </Button>
        </Link>
      </div>
    </div>
  ) : null;

  return (
    <>
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

      {mounted && menuOverlay && createPortal(menuOverlay, document.body)}
    </>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type CookiePreferences = {
  necessary: true; // vzdy true, nelze vypnout
  analytics: boolean;
  marketing: boolean;
};

const COOKIE_CONSENT_KEY = "cookie_consent";
const COOKIE_CONSENT_VERSION = "1"; // zvysit pri zmene cookies

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => {
        dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      });
    }
  }, [visible]);

  useEffect(() => {
    // Zpozdeni aby se banner nezobrazil behem SSR hydrace
    const timer = setTimeout(() => {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        setVisible(true);
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version !== COOKIE_CONSENT_VERSION) {
          setVisible(true); // nova verze cookies → znovu souhlas
        }
      } catch {
        setVisible(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  function saveConsent(preferences: CookiePreferences) {
    const data = {
      version: COOKIE_CONSENT_VERSION,
      preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
    // Dispatch custom event — ostatni komponenty (Analytics) naslouchaji
    window.dispatchEvent(
      new CustomEvent("cookie-consent-changed", { detail: preferences })
    );
    setVisible(false);
  }

  function acceptAll() {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  }

  function acceptNecessaryOnly() {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  }

  function saveCustom() {
    saveConsent(prefs);
  }

  if (!visible) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Nastaveni cookies"
    >
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Pouzivame cookies
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Pouzivame cookies pro spravne fungovani webu a analyzu navstevnosti.
          Vice informaci v nasich{" "}
          <Link
            href="/zasady-cookies"
            className="text-orange-700 underline hover:text-orange-600"
          >
            zasadach cookies
          </Link>
          .
        </p>

        {showDetails && (
          <div className="mb-4 space-y-3 border-t border-gray-100 pt-4">
            <label className="flex items-start gap-3 cursor-not-allowed">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-0.5 accent-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Nutne cookies
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Zakladni funkce webu — prihlaseni, kosik, cookie consent. Nelze vypnout.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) =>
                  setPrefs({ ...prefs, analytics: e.target.checked })
                }
                className="mt-0.5 accent-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Analyticke cookies
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mereni navstevnosti webu (Plausible Analytics / Google Analytics).
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.marketing}
                onChange={(e) =>
                  setPrefs({ ...prefs, marketing: e.target.checked })
                }
                className="mt-0.5 accent-orange-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Marketingove cookies
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cilena reklama a remarketing (Facebook Pixel, Google Ads).
                </p>
              </div>
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={acceptAll} variant="primary" size="sm">
            Prijmout vse
          </Button>
          <Button onClick={acceptNecessaryOnly} variant="outline" size="sm">
            Pouze nutne
          </Button>
          {!showDetails ? (
            <button
              onClick={() => setShowDetails(true)}
              className="text-sm text-gray-500 hover:text-gray-900 underline py-2"
            >
              Nastaveni
            </button>
          ) : (
            <Button onClick={saveCustom} variant="outline" size="sm">
              Ulozit nastaveni
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

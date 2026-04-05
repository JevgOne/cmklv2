"use client";

import { useState, useEffect } from "react";

export type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const COOKIE_CONSENT_KEY = "cookie_consent";

/**
 * Hook pro cteni aktualniho cookie consentu.
 * Vraci null pokud uzivatel jeste neudal souhlas.
 * Automaticky reaguje na zmeny consentu (CustomEvent).
 */
export function useCookieConsent(): CookiePreferences | null {
  const [prefs, setPrefs] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    function loadPrefs(): CookiePreferences | null {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) return null;
      try {
        const parsed = JSON.parse(stored);
        return parsed.preferences as CookiePreferences;
      } catch {
        return null;
      }
    }

    setPrefs(loadPrefs());

    function handleChange(e: Event) {
      const detail = (e as CustomEvent).detail as CookiePreferences;
      setPrefs(detail);
    }

    window.addEventListener("cookie-consent-changed", handleChange);
    return () => window.removeEventListener("cookie-consent-changed", handleChange);
  }, []);

  return prefs;
}

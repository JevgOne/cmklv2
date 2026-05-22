# Plan P0-04: Cookie consent banner

**Priorita:** P0 (bloker pro launch)
**Slozitost:** M
**Zavislosti:** ZADNE
**Batch:** 1

---

## Cil

Implementovat cookie consent banner dle GDPR a smernice ePrivacy. Banner musi nabizet volbu "Prijmout vse", "Pouze nutne" a moznost detailni konfigurace. Nenecessary scripty (analytics, marketing) se nesmi nacitat pred souhlasem.

---

## Kroky implementace

### Krok 1: Vytvorit CookieConsent komponentu

**Soubor:** `components/web/CookieConsent.tsx` (NOVY)

```tsx
"use client";

import { useState, useEffect } from "react";
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
      className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6"
      role="dialog"
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
            className="text-orange-500 underline hover:text-orange-600"
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
```

**Poznamky k implementaci:**
- `z-[100]` zajisti ze banner je nad vsim ostatnim (CompareBar ma z-50)
- `role="dialog"` a `aria-label` pro accessibility
- `setTimeout(500)` zamezi FOUC/hydration flash pri nacitani stranky
- `cursor-not-allowed` na nutnych cookies — vizualne jasne ze nelze vypnout
- Button pouziva existujici design system komponentu (`@/components/ui/Button`) s variantami `primary` a `outline`, size `sm`

### Krok 2: Pridat do web layoutu

**Soubor:** `app/(web)/layout.tsx`

Aktualni stav (radky 50-57):
```tsx
return (
  <CompareProvider>
    {navbar}
    <main className="min-h-[calc(100vh-72px)]">{children}</main>
    {footer}
    <CompareBar />
  </CompareProvider>
);
```

**Zmena — pridat import a komponentu ZA CompareBar, pred uzaviraci CompareProvider:**

```tsx
import { CookieConsent } from "@/components/web/CookieConsent";

// ...

return (
  <CompareProvider>
    {navbar}
    <main className="min-h-[calc(100vh-72px)]">{children}</main>
    {footer}
    <CompareBar />
    <CookieConsent />
  </CompareProvider>
);
```

**Presny diff:**
- Radek 13 (importy): pridat `import { CookieConsent } from "@/components/web/CookieConsent";`
- Radek 55 (za `<CompareBar />`): pridat `<CookieConsent />`

### Krok 3: Utilitni hook pro cteni consentu

**Soubor:** `lib/hooks/useCookieConsent.ts` (NOVY)

Adresar `lib/hooks/` jiz existuje (obsahuje useCamera, useCurrentUser, useDraft, useOnlineStatus).

```tsx
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
```

### Krok 4: Stranka Zasady cookies

**Soubor:** `app/(web)/zasady-cookies/page.tsx` (NOVY)

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BASE_URL } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Zasady cookies",
  description: "Informace o pouzivani cookies na platforme CarMakler. Prehled cookies, ucely a zpusob spravy.",
  openGraph: {
    title: "Zasady cookies | CarMakler",
    description: "Informace o pouzivani cookies na platforme CarMakler.",
  },
  alternates: {
    canonical: `${BASE_URL}/zasady-cookies`,
  },
};

const cookies = [
  {
    name: "next-auth.session-token",
    purpose: "Autentizace uzivatele (prihlaseni)",
    expiry: "30 dni",
    type: "Nutne",
  },
  {
    name: "next-auth.csrf-token",
    purpose: "Ochrana proti CSRF utokum",
    expiry: "Relace",
    type: "Nutne",
  },
  {
    name: "next-auth.callback-url",
    purpose: "Presmerovani po prihlaseni",
    expiry: "Relace",
    type: "Nutne",
  },
  {
    name: "site_access",
    purpose: "Overeni pristupu na staging prostredi",
    expiry: "30 dni",
    type: "Nutne",
  },
  {
    name: "cookie_consent",
    purpose: "Ulozeni vasich preferenci ohledne cookies (localStorage)",
    expiry: "Neomezene",
    type: "Nutne",
  },
  {
    name: "plausible_ignore",
    purpose: "Plausible Analytics — vylouceni z analytiky (opt-out)",
    expiry: "Neomezene",
    type: "Analyticke",
  },
  {
    name: "_ga, _ga_*",
    purpose: "Google Analytics 4 — identifikace navstevnika (pokud pouzito)",
    expiry: "2 roky",
    type: "Analyticke",
  },
  {
    name: "_fbp",
    purpose: "Facebook Pixel — identifikace pro remarketing (pokud pouzito)",
    expiry: "3 mesice",
    type: "Marketingove",
  },
];

export default function ZasadyCookiesPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Domu", href: "/" },
          { label: "Zasady cookies" },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
          Zasady cookies
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Posledni aktualizace: [DOPLNIT DATUM]
        </p>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-orange-500">

          <section>
            <h2>Co jsou cookies</h2>
            <p>
              Cookies jsou male textove soubory, ktere se ukladaji do vaseho prohlizece pri
              navsteve webovych stranek. Slouzi k zapamatovani vasich preferenci, prihlaseni
              a analyze navstevnosti.
            </p>
          </section>

          <section>
            <h2>Kategorie cookies</h2>
            <h3>Nutne cookies</h3>
            <p>
              Nezbytne pro zakladni funkce webu — prihlaseni, kosik, ochrana proti utokum.
              Tyto cookies se nastavuji automaticky a nelze je vypnout, aniz by doslo k
              naruseni funkce webu.
            </p>
            <h3>Analyticke cookies</h3>
            <p>
              Pouzivame je pro mereni navstevnosti a pochopeni, jak navstevnici pouzivaji
              nasi platformu. Primarni nastroj: <strong>Plausible Analytics</strong> (privacy-friendly,
              bez osobnich cookies). Data jsou agregovana a anonymni.
              Tyto cookies se aktivuji jen s vasim souhlasem.
            </p>
            <h3>Marketingove cookies</h3>
            <p>
              Slouzi k zobrazeni relevantnich reklam na externich platformach (Facebook, Google).
              Aktualne nepouzivame marketingove cookies. V budoucnu mohou byt aktivovany
              jen s vasim vylednym souhlasem.
            </p>
          </section>

          <section>
            <h2>Prehled cookies</h2>
          </section>
        </div>

        {/* Tabulka mimo prose pro lepsi kontrolu */}
        <div className="overflow-x-auto mt-4 mb-8">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Nazev</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ucel</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Expirace</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Typ</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {cookies.map((c) => (
                <tr key={c.name} className="border-t border-gray-100">
                  <td className="py-3 px-4 font-mono text-xs">{c.name}</td>
                  <td className="py-3 px-4">{c.purpose}</td>
                  <td className="py-3 px-4">{c.expiry}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.type === "Nutne"
                          ? "bg-gray-100 text-gray-700"
                          : c.type === "Analyticke"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {c.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-orange-500">
          <section>
            <h2>Jak spravovat cookies</h2>
            <p>
              Svuj souhlas s cookies muzete kdykoliv zmenit kliknutim na odkaz &bdquo;Nastaveni
              cookies&ldquo; v paticce naseho webu, nebo smazanim cookies ve svem prohlizeci.
            </p>
            <p>
              Podrobne informace o zpracovani osobnich udaju najdete na strance{" "}
              <Link href="/ochrana-osobnich-udaju">Ochrana osobnich udaju</Link>.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
```

### Krok 5: loading.tsx pro zasady-cookies

**Soubor:** `app/(web)/zasady-cookies/loading.tsx` (NOVY) — shodne s P0-01 vzor.

### Krok 6: Pridat do sitemap.ts

Pridat `/zasady-cookies` do staticPages pole.

---

## Navaznost na design system

- **Button:** Pouziva `@/components/ui/Button` s `variant="primary"` (orange gradient) a `variant="outline"` (bile s rameckem) — presne dle Button.tsx API
- **Z-index:** `z-[100]` — nad CompareBar (z-50), nad Navbar
- **Barvy:** `text-orange-500` pro linky, `bg-white` pro banner, `accent-orange-500` pro checkboxy
- **Spacing:** `p-6` uvnitr banneru, `gap-3` mezi tlacitky — konzistentni s projektem
- **Accessibility:** `role="dialog"`, `aria-label`, `cursor-not-allowed` na disabled checkbox
- **Zasady cookies:** Stejna typografie jako ostatni pravni stranky (prose styling), tabulka s badges

---

## Dulezite poznamky

- CookieConsent pouziva **localStorage**, ne cookie — GDPR to dovoluje protoze jde o technicke ulozeni preference
- CustomEvent `cookie-consent-changed` umoznuje Analytics komponente (P1-11) dynamicky reagovat na zmenu consentu
- Plausible Analytics **nevyzaduje cookie consent** (privacy-friendly) — ale pokud se rozhodne pro GA4, MUSI byt podminen `consent.analytics`
- Hook `useCookieConsent` je v `lib/hooks/` kde uz jsou ostatni hooks projektu (useCamera, useCurrentUser, useDraft, useOnlineStatus)

---

## Soubory k vytvoreni/uprave

| Soubor | Akce |
|--------|------|
| `components/web/CookieConsent.tsx` | NOVY — kompletni kod vyse |
| `lib/hooks/useCookieConsent.ts` | NOVY — kompletni kod vyse |
| `app/(web)/layout.tsx` | UPRAVIT — pridat import (radek 13) + `<CookieConsent />` za CompareBar (radek 55) |
| `app/(web)/zasady-cookies/page.tsx` | NOVY — kompletni kod vyse |
| `app/(web)/zasady-cookies/loading.tsx` | NOVY — viz P0-01 vzor |
| `app/sitemap.ts` | UPRAVIT — pridat /zasady-cookies do staticPages |

## Overeni

- [ ] Banner se zobrazi pri prvni navsteve (zadny consent v localStorage)
- [ ] Banner se NEzobrazi pokud uz consent existuje v localStorage
- [ ] "Prijmout vse" ulozi `{analytics: true, marketing: true}` a skryje banner
- [ ] "Pouze nutne" ulozi `{analytics: false, marketing: false}` a skryje banner
- [ ] "Nastaveni" zobrazi detailni checkboxy (3 kategorie)
- [ ] "Nutne cookies" checkbox je disabled a checked (nelze vypnout)
- [ ] "Ulozit nastaveni" ulozi custom preferences
- [ ] Po reload se banner NEzobrazi (consent je v localStorage)
- [ ] CustomEvent `cookie-consent-changed` se dispatchuje pri kazdem ulozeni
- [ ] Banner ma z-index nad CompareBar a Navbar
- [ ] Banner je responzivni — na mobilu plna sirka, na desktopu max-w-2xl
- [ ] Odkaz na /zasady-cookies funguje
- [ ] Stranka /zasady-cookies zobrazuje tabulku cookies s badges
- [ ] Accessibility: role="dialog", aria-label, focus management

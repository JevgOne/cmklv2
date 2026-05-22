# Plan P1-15: Accessibility Audit (WCAG 2.1 AA)

**Priorita:** P1
**Slozitost:** L (4-6 hodin)
**Zavislosti:** zadne
**Batch:** 3

---

## Cil

Dosazeni WCAG 2.1 AA shody pro vsechny verejne stranky. Identifikovat a opravit pristupnostni bariery: ARIA atributy, focus management, keyboard navigace, kontrast, formularova pristupnost.

---

## Analyza aktualniho stavu

### Celkovy odhad shody: ~60% WCAG 2.1 AA

### 1. Jazyk stranky — OK

`app/layout.tsx` (radek 73): `<html lang="cs">` — spravne.

### 2. Metadata/titulky — OK

Root layout: title template `"%s | CarMakler"`. Vetsina stranek exportuje `metadata`.

### 3. Skip-to-content — CHYBI

**KRITICKY NALEZ (WCAG 2.4.1 Bypass Blocks, A):**
Zadny layout neobsahuje skip link. Overeno grepem — zadny vyskyt "skip" v zdrojovem kodu.

- `app/(web)/layout.tsx` — chybi
- `app/(pwa)/layout.tsx` — chybi

### 4. Modal — BEZ ARIA A FOCUS TRAP

**Soubor:** `components/ui/Modal.tsx` (68 radku)

**Nalezene problemy (WCAG 4.1.2 Name/Role/Value A, 2.4.3 Focus Order A):**
- Kontejner: chybi `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Zaviraci tlacitko (radek 48-52): chybi `aria-label="Zavrit"` — screenreader cte jen "krizek" symbol
- Focus trap CHYBI — Tab probuble ven z modalu
- Focus se po otevreni nepresune do modalu
- Po zavreni se focus nevrati na spousteci element
- **Escape** funguje (radky 17-21) — OK

### 5. Tabs — BEZ ARIA ROLES

**Soubor:** `components/ui/Tabs.tsx` (45 radku)

**Nalezene problemy (WCAG 4.1.2 A):**
- Kontejner: chybi `role="tablist"`
- Tlacitka: chybi `role="tab"`, `aria-selected`
- Chybi `tabIndex` management (aktivni tab 0, ostatni -1)
- Keyboard navigace sipkami chybi

### 6. Toggle — OK

`components/ui/Toggle.tsx` — ma `role="switch"` a `aria-checked`. Spravne.

### 7. Obrazky — `<img>` misto next/image

**WCAG 1.1.1 Non-text Content (A):** Alt texty JSOU pritomne — OK.

**Performance issue:** 22 souboru pouziva nativni `<img>` tag misto `<Image>` z next/image. Znamena to:
- Zadna automaticka lazy loading optimalizace
- Zadny responsive srcset
- Zadna WebP/AVIF konverze
- Potencialni CLS problemy (chybi width/height)

**Logos (opakovane na kazde strance, 13 vyskytu):**
- `components/main/Navbar.tsx` — logo-dark.png
- `components/main/Footer.tsx` — logo-white.png
- `components/main/MobileMenu.tsx` — logo-dark.png
- `components/web/Navbar.tsx` — logo-dark.png
- `components/web/Footer.tsx` — logo-white.png
- `components/web/MobileMenu.tsx` — logo-dark.png
- `components/shop/Navbar.tsx` — logo-dark.png
- `components/shop/Footer.tsx` — logo-white.png
- `components/inzerce/Navbar.tsx` — logo-dark.png
- `components/inzerce/Footer.tsx` — logo-white.png
- `components/marketplace/Navbar.tsx` — logo-white.png
- `components/marketplace/Footer.tsx` — logo-white.png
- `components/admin/AdminSidebar.tsx` — logo-white.png

**Content images (9 vyskytu):**
- `components/web/VehicleCard.tsx` (radek 50) — `<img src={car.photo}>` ← klicova karta!
- `app/(web)/dily/[slug]/page.tsx` (radky 148, 165) — fotky dilu
- `app/(web)/dily/kosik/page.tsx` (radek 67) — polozka v kosiku
- `app/(web)/marketplace/dealer/[id]/page.tsx` (radek 132) — fotky oprav
- `app/(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` (radek 255) — fotky reklamace
- `components/pwa-parts/parts/PartCard.tsx` (radek 34)
- `components/pwa/onboarding/ProfileForm.tsx` (radek 99) — preview (base64)
- `components/pwa/vehicles/DamageReportForm.tsx` (radek 154) — preview (base64)
- `components/admin/BrokerApprovalCard.tsx` (radek 97)

**Pozn.:** Pouze 6 souboru pouzivaji `import Image from "next/image"` — vsechny v PWA.

### 8. Nav elementy — VETSINA BEZ aria-label

**WCAG 1.3.1 Info and Relationships (A):**

**S aria-label (OK):**
- Breadcrumbs nav — 5 souboru ma `aria-label="Breadcrumb"` (Breadcrumbs.tsx, VehicleLandingPage.tsx, dily/kategorie, dily/znacka, kolik-stoji-moje-auto, jak-prodat-auto)

**BEZ aria-label (14 souboru):**
- `components/main/Navbar.tsx` (radek 104) — hlavni navigace
- `components/web/Navbar.tsx` (radek 111) — hlavni navigace
- `components/shop/Navbar.tsx` (radek 13) — hlavni navigace
- `components/inzerce/Navbar.tsx` (radek 12) — hlavni navigace
- `components/marketplace/Navbar.tsx` (radek 12) — hlavni navigace
- `components/web/MobileMenu.tsx` (radek 69) — mobilni navigace
- `components/main/MobileMenu.tsx` (radek 70) — mobilni navigace
- `components/pwa/BottomNav.tsx` (radek 123) — spodni navigace
- `components/pwa-parts/SupplierBottomNav.tsx` (radek 60) — spodni navigace
- `components/admin/AdminSidebar.tsx` (radek 129) — admin navigace
- `components/partner/PartnerLayout.tsx` (radek 80) — partner navigace
- `app/(web)/muj-ucet/layout.tsx` (radek 30) — menu uctu
- `app/(web)/moje-inzeraty/layout.tsx` (radek 28) — menu inzeratu
- `app/(web)/dily/[slug]/page.tsx` (radek 128) — breadcrumb bez aria-label

Kdyz stranka obsahuje vice `<nav>` elementu (navbar + breadcrumbs + sidebar), je nutne je rozlisit pres aria-label.

### 9. Kontrast barev — KRITICKE PROBLEMY

**WCAG 1.4.3 Contrast Minimum (AA) — 4.5:1 normalní text, 3:1 velky text**

| Barva | Hex | Kontrast na bile | Splnuje AA text? | Pouziti |
|-------|-----|------------------|------------------|---------|
| orange-500 | #F97316 | 3.0:1 | NE | Linky, akcni text |
| orange-600 | #EA580C | 4.6:1 | tесне ANO | Hover linky |
| orange-700 | #C2410C | 5.9:1 | ANO | -- |
| gray-400 | #A1A1AA | 3.6:1 | NE | Sekundarni text, placeholdery |
| gray-500 | #71717A | 5.0:1 | ANO | -- |
| gray-600 | #52525B | 7.5:1 | ANO | -- |
| white na orange-500 bg | -- | 3.0:1 | NE pro maly text, ANO pro velky bold | CTA buttony |

**Kriticke opravy:**
- Orange text na bilem: zmenit z `text-orange-500` na `text-orange-700` (5.9:1) nebo pridat `underline`
- Gray sekundarni text: zmenit z `text-gray-400` na `text-gray-500` (5.0:1)
- CTA buttony (bily text na orange bg): OK pro velky bold text, ale tесне — zvazit orange-600

### 10. Focus-visible — ODSTRANEN NATIVNI RING

**WCAG 2.4.7 Focus Visible (AA):**

- `globals.css` neobsahuje ZADNE focus-visible styly
- Vsechny UI komponenty (Input, Select, Textarea) pouzivaji `focus:outline-none` — **ODSTRANUJI nativni focus ring**
- Input/Select/Textarea maji nahradni `focus:border-orange-500 focus:shadow-[...]` — castecne OK
- `Button.tsx` — NEMA zadny viditelny focus styl
- Links, card elementy — NEMAJI focus styl
- `tabIndex` se NEPOUZIVA nikde v components/

### 11. Formularova pristupnost — CASTECNE

**WCAG 1.3.1 Info and Relationships (A), 3.3.1 Error Identification (A):**

**Dobre:**
- `Input.tsx`: `htmlFor` + `useId()` — label-input propojeni OK
- `Select.tsx`: `htmlFor` + `useId()` — OK
- `Textarea.tsx`: `htmlFor` + `useId()` — OK

**Chybi:**
- `aria-describedby` pro error message — screenreader neprecte chybu pri focus na input
- `aria-invalid` pro error state
- `aria-required` pro povinne fieldy
- Error span nema `id` — nelze propojit
- Error span nema `role="alert"` — screenreader neoznami novou chybu

### 12. Aria-live regiony — CHYBI ZCELA

**WCAG 4.1.3 Status Messages (AA):**
- Zadny `aria-live`, `role="alert"`, `role="status"` v UI komponentach
- Chybi u: form success/error zprav, kosik counter, loading states, search results

### 13. CookieConsent — CASTECNE OK

**Soubor:** `components/web/CookieConsent.tsx`
- Ma `role="dialog"` a `aria-label="Nastaveni cookies"` — OK
- Chybi `aria-modal="true"`
- Chybi focus management — po zobrazeni se focus nepresune do dialogu
- Uzivatel na klavesnici se nedozvi ze se dialog zobrazil

### 14. Heading hierarchy — VETSINOU OK

H1 pritomno na vsech strankach. Vetsina dodrzuje h1 > h2 > h3 hierarchii.

---

## Kroky implementace

### Krok 1: Globalni focus-visible styly

**Soubor:** `app/globals.css`

**Pridat na konec:**
```css
/* ===== Accessibility: Focus visible ===== */
*:focus-visible {
  outline: 2px solid var(--orange-500);
  outline-offset: 2px;
}

/* Inputs maji vlastni focus styl — reset outline */
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: none;
}
```

### Krok 2: Skip-to-content link

**Soubor:** `app/(web)/layout.tsx`

```diff
  return (
    <CompareProvider>
+     <a
+       href="#main-content"
+       className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:bg-orange-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:no-underline"
+     >
+       Prejit na obsah
+     </a>
      {navbar}
-     <main className="min-h-[calc(100vh-72px)]">{children}</main>
+     <main id="main-content" className="min-h-[calc(100vh-72px)]">{children}</main>
      {footer}
      <CompareBar />
      <CookieConsent />
    </CompareProvider>
  );
```

### Krok 3: Modal — ARIA + focus trap + focus return

**Soubor:** `components/ui/Modal.tsx`

**Kompletni prepis (100 radku):**
```tsx
"use client";

import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = "modal-title";

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // Focus trap — Tab cycles within dialog
  const handleTab = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleTab);
      document.body.style.overflow = "hidden";
      // Auto-focus first focusable element
      requestAnimationFrame(() => {
        dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      });
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("keydown", handleTab);
        document.body.style.overflow = "";
        triggerRef.current?.focus(); // Return focus
      };
    }
  }, [open, handleEscape, handleTab]);

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn("bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-auto", className)}
      >
        {title && (
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 id={titleId} className="text-xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Zavrit"
              className="w-9 h-9 bg-gray-100 rounded-[10px] flex items-center justify-center cursor-pointer text-lg hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
```

### Krok 4: Tabs — ARIA roles + keyboard navigace

**Soubor:** `components/ui/Tabs.tsx`

**Kompletni prepis:**
```tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab?: string;
  defaultTab?: string;
  onTabChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab: controlledTab, defaultTab, onTabChange, className }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.value);
  const isControlled = controlledTab !== undefined;
  const currentTab = isControlled ? controlledTab : internalTab;
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleChange = (value: string) => {
    if (!isControlled) setInternalTab(value);
    onTabChange?.(value);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = tabs.findIndex((t) => t.value === currentTab);
      let newIndex = currentIndex;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        newIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        newIndex = tabs.length - 1;
      } else {
        return;
      }
      const newTab = tabs[newIndex];
      handleChange(newTab.value);
      tabRefs.current.get(newTab.value)?.focus();
    },
    [tabs, currentTab]
  );

  return (
    <div
      role="tablist"
      className={cn("flex gap-1 bg-gray-100 p-1 rounded-lg", className)}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.value;
        return (
          <button
            key={tab.value}
            ref={(el) => { if (el) tabRefs.current.set(tab.value, el); }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleChange(tab.value)}
            className={cn(
              "px-5 py-2.5 bg-transparent text-sm font-semibold text-gray-600 rounded-[10px] cursor-pointer transition-all duration-200 hover:text-gray-900 border-none",
              isActive && "bg-white text-gray-900 shadow-sm"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
```

### Krok 5: Input/Select/Textarea — aria-describedby + aria-invalid

**Soubor:** `components/ui/Input.tsx`

**Diff:**
```diff
  export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, id: idProp, ...props }, ref) => {
      const generatedId = useId();
      const id = idProp || generatedId;
+     const errorId = error ? `${id}-error` : undefined;

      return (
        <div className="flex flex-col gap-2">
          {label && (
            <label htmlFor={id} className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
              {label}
            </label>
          )}
          <input
            ref={ref}
            id={id}
+           aria-invalid={error ? true : undefined}
+           aria-describedby={errorId}
            className={cn(/* ... */)}
            {...props}
          />
-         {error && <span className="text-[13px] text-error-500">{error}</span>}
+         {error && (
+           <span id={errorId} role="alert" className="text-[13px] text-error-500">
+             {error}
+           </span>
+         )}
        </div>
      );
    }
  );
```

**Soubor:** `components/ui/Select.tsx` — stejna zmena (errorId, aria-invalid, aria-describedby, id+role na error span)

**Soubor:** `components/ui/Textarea.tsx` — stejna zmena

### Krok 6: Nav aria-label na vsech navigacich

**Zmeny (jednoradkove, aria-label atribut):**

| Soubor | Radek | Zmena |
|--------|-------|-------|
| `components/main/Navbar.tsx` | 104 | `<nav aria-label="Hlavni navigace" className=...>` |
| `components/web/Navbar.tsx` | 111 | `<nav aria-label="Hlavni navigace" className=...>` |
| `components/shop/Navbar.tsx` | 13 | `<nav aria-label="Hlavni navigace" className=...>` |
| `components/inzerce/Navbar.tsx` | 12 | `<nav aria-label="Hlavni navigace" className=...>` |
| `components/marketplace/Navbar.tsx` | 12 | `<nav aria-label="Hlavni navigace" className=...>` |
| `components/web/MobileMenu.tsx` | 69 | `<nav aria-label="Mobilni menu" className=...>` |
| `components/main/MobileMenu.tsx` | 70 | `<nav aria-label="Mobilni menu" className=...>` |
| `components/pwa/BottomNav.tsx` | 123 | `<nav aria-label="Spodni navigace" className=...>` |
| `components/pwa-parts/SupplierBottomNav.tsx` | 60 | `<nav aria-label="Spodni navigace" className=...>` |
| `components/admin/AdminSidebar.tsx` | 129 | `<nav aria-label="Administrace" className=...>` |
| `components/partner/PartnerLayout.tsx` | 80 | `<nav aria-label="Partner menu" className=...>` |
| `app/(web)/muj-ucet/layout.tsx` | 30 | `<nav aria-label="Menu uctu" className=...>` |
| `app/(web)/moje-inzeraty/layout.tsx` | 28 | `<nav aria-label="Menu inzeratu" className=...>` |
| `app/(web)/dily/[slug]/page.tsx` | 128 | `<nav aria-label="Breadcrumb" className=...>` |
| `app/(web)/shop/produkt/[slug]/page.tsx` | 120 | `<nav aria-label="Breadcrumb" className=...>` |
| `app/(web)/inzerce/registrace/page.tsx` | 184 | `<nav aria-label="Breadcrumb" className=...>` |
| `app/(web)/inzerce/pridat/page.tsx` | 10 | `<nav aria-label="Breadcrumb" className=...>` |
| `app/(web)/nabidka/[slug]/page.tsx` | 493, 929 | `<nav aria-label="Breadcrumb" className=...>` |

### Krok 7: Opravy kontrastu

**A) Orange text na bilem pozadi:**

Hledat `text-orange-500` pouzite pro text/linky na bilem pozadi a zmenit na `text-orange-700`:

```diff
- className="text-orange-500 underline hover:text-orange-600"
+ className="text-orange-700 underline hover:text-orange-600"
```

Klicove soubory:
- `components/web/CookieConsent.tsx` (radek 88) — link na cookies zasady
- Vsechny inline linky v prose obsahu

**B) Gray-400 sekundarni text:**

Hledat `text-gray-400` na bilem/svetlem pozadi a zmenit na `text-gray-500`:
- POZOR: `text-gray-400` na tmavem pozadi (footer, dark sections) NEMEN

### Krok 8: img → next/image migrace

**Faze A — Logo images (priority, opakovane):**

```diff
+ import Image from "next/image";

- <img src="/brand/logo-dark.png" alt="CarMakler" className="h-10 sm:h-12 w-auto object-contain" />
+ <Image src="/brand/logo-dark.png" alt="CarMakler" width={120} height={48} className="h-10 sm:h-12 w-auto object-contain" priority />
```

13 souboru (viz seznam v sekci 7).

**Faze B — Content images:**

```diff
- <img src={car.photo} alt={car.name} className="w-full h-full object-cover" loading="lazy" />
+ <Image src={car.photo} alt={car.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
```

9 souboru (viz seznam v sekci 7).

Pro base64 preview (ProfileForm, DamageReportForm, reklamace) pouzit `unoptimized` prop.

**Pozn.:** next.config.ts jiz ma `remotePatterns` pro `res.cloudinary.com` — OK.

### Krok 9: CookieConsent — focus management

**Soubor:** `components/web/CookieConsent.tsx`

```diff
+ import { useState, useEffect, useRef } from "react";

+ const dialogRef = useRef<HTMLDivElement>(null);
+
+ useEffect(() => {
+   if (visible) {
+     requestAnimationFrame(() => {
+       dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
+     });
+   }
+ }, [visible]);

  return (
    <div
+     ref={dialogRef}
      className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6"
      role="dialog"
+     aria-modal="true"
      aria-label="Nastaveni cookies"
    >
```

### Krok 10: LiveRegion pro dynamicky obsah

**Novy soubor:** `components/ui/LiveRegion.tsx`

```tsx
interface LiveRegionProps {
  message: string;
  assertive?: boolean;
}

export function LiveRegion({ message, assertive = false }: LiveRegionProps) {
  return (
    <div
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      className="sr-only"
    >
      {message}
    </div>
  );
}
```

Integrace do:
- Kosik (pocet polozek po pridani/odebrani)
- Form submit (uspech/chyba)
- Search results (pocet nalezenych)

---

## Soubory k uprave/vytvoreni

| Soubor | Zmena | Narocnost |
|--------|-------|-----------|
| `app/globals.css` | Focus-visible styly | XS |
| `app/(web)/layout.tsx` | Skip link + id="main-content" | XS |
| `components/ui/Modal.tsx` | Kompletni prepis — ARIA + focus trap | M |
| `components/ui/Tabs.tsx` | Kompletni prepis — ARIA + keyboard | S |
| `components/ui/Input.tsx` | aria-describedby, aria-invalid | XS |
| `components/ui/Select.tsx` | aria-describedby, aria-invalid | XS |
| `components/ui/Textarea.tsx` | aria-describedby, aria-invalid | XS |
| 18 souboru s `<nav>` | aria-label | S |
| ~10 souboru s `text-orange-500` | Kontrast oprava → orange-700 | S |
| ~10 souboru s `text-gray-400` | Kontrast oprava → gray-500 | S |
| 13 souboru s logo `<img>` | Migrace na next/image | M |
| 9 souboru s content `<img>` | Migrace na next/image | M |
| `components/web/CookieConsent.tsx` | aria-modal + focus management | XS |
| `components/ui/LiveRegion.tsx` | NOVY | XS |

---

## Poradi implementace (podle priority)

1. **Focus-visible** (globals.css) — rychla oprava, velky dopad
2. **Skip-to-content** (layout.tsx) — WCAG A, jednoradkova zmena
3. **Modal ARIA + focus trap** (Modal.tsx) — nejslozitejsi cast, WCAG A
4. **Input/Select/Textarea errors** (3 soubory) — WCAG A, sdi lene komponenty
5. **Tabs ARIA + keyboard** (Tabs.tsx) — WCAG A
6. **Nav aria-labels** (18 souboru) — WCAG A, jednoduche ale mnoho souboru
7. **Kontrast opravy** (~20 souboru) — WCAG AA
8. **img → next/image** (~22 souboru) — performance + pristupnost
9. **CookieConsent focus** — WCAG A
10. **LiveRegion** — WCAG AA, nove

---

## Overeni

- [ ] Tab test: vsechny interaktivni elementy dostupne a videt focus ring
- [ ] Skip link: Tab 1x → viditelny → Enter → focus na main
- [ ] Modal: focus trap funguje, Escape zavre, focus return
- [ ] Tabs: sipky prepinaji, aria-selected spravne
- [ ] Screenreader: VoiceOver cte error messages pri focus na input
- [ ] Kontrast: zadny text < 4.5:1 na bilem (krome velkeho bold textu ≥ 3:1)
- [ ] Vsechny `<nav>` maji aria-label
- [ ] Vsechny `<img>` migrovany na `<Image>` (nebo planovane v dalsi iteraci)
- [ ] CookieConsent: focus se presune pri zobrazeni
- [ ] Lighthouse Accessibility score ≥ 90
- [ ] Build prochazi

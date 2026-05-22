# Plan: MAXIMALNI mobilni optimalizace cele platformy

**Datum:** 2026-04-11
**Agent:** Planovac
**Zdroj:** Task #47 (team-lead)

---

## Vysledky auditu

### Celkove hodnoceni: 7.5/10

Platforma je na solidnim zakladu — mobile-first pristup (Tailwind), safe area insets (23+ vyskytu), touch targets (44×44), loading states (144 souboru), PWA manifest kompletni. Hlavni mezery: chybejici viewport export, male typografie (<12px), zadny pull-to-refresh, nepripravena tabulkova data pro mobil.

---

## §1 KRITICKE — Blokuje launch

### 1.1 Chybejici `export const viewport` v root layout

**Zavaznost:** KRITICKA — vsechny stranky nemaji viewport meta tag z Next.js
**Soubor:** `app/layout.tsx`
**Problem:** Next.js 15 App Router vyzaduje explicitni `export const viewport: Viewport` vedle `export const metadata`. BEZ toho Next.js NEPRIDA `<meta name="viewport">` do `<head>`. Vsechny stranky jsou postizeny.
**Dopad:**
- Stranky se nezoomuje spravne na mobilech
- Riskujeme double-tap zoom na formularnich polich
- iOS Safari nerespektuje `width=device-width` bez tagu
- Core Web Vitals — CLS issue na vsech strankach

**Fix:**
```typescript
// app/layout.tsx — pridat PRED export const metadata
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,       // accessibility — neblokovat zoom
  viewportFit: "cover",  // safe area insets fungovat jen s cover
  themeColor: "#F97316",  // orange — status bar color na mobilech
};
```
**Effort:** 5 min
**STOP threshold:** Nesmime pouzit `maximum-scale=1` nebo `user-scalable=no` — porusuje WCAG 2.1 SC 1.4.4.

---

## §2 VYSOKA PRIORITA — Quick-wins (<30 min kazdy)

### 2.1 Minimalni velikost fontu — text-[10px]/text-[11px] audit

**Zavaznost:** VYSOKA — WCAG + iOS citelnost
**Problem:** 30+ vyskytu `text-[10px]` a `text-[11px]` v komponentach. Pod 12px je text na mobilech tezko citelny, zvlast na Android zarizeni s nizsi hustotou pixelu.
**Postizene soubory (TOP priorita — uzivatelsky viditelne):**

| Soubor | Line | Aktualni | Fix |
|--------|------|----------|-----|
| `components/pwa/BottomNav.tsx` | 139 | `text-[10px]` | `text-[11px]` |
| `components/pwa-parts/SupplierBottomNav.tsx` | 78, 95 | `text-[10px]` | `text-[11px]` |
| `components/pwa-parts/SupplierTopBar.tsx` | 33 | `text-[10px]` | `text-[11px]` |
| `components/pwa/onboarding/OnboardingProgress.tsx` | 109 | `text-[10px]` | `text-[11px]` |
| `app/(pwa)/makler/stats/page.tsx` | 328,337,349,358 | `text-[10px]` | `text-[11px]` |

**Akceptovatelne vyjimky** (dekorativni, ne pro cteni):
- Badge-countery (`text-[10px] font-bold` v kruhovych badges) — OK, jsou male a tucne
- Photo slot labely v editacnim rezimu — kontextove, kratke texty

**Fix:** Hromadna zmena `text-[10px]` → `text-[11px]` ve vsech navigacnich a informacnich komponentach. Effort: 20 min.

### 2.2 Raw `<img>` tag → Next.js `<Image>`

**Zavaznost:** STREDNI — performance + CLS
**Soubor:** `components/ui/SearchOverlay.tsx`
**Problem:** Jediny soubor v aplikaci (mimo node_modules) pouziva raw `<img>` tag misto Next.js `<Image>`. Zpusobuje CLS (layout shift) a nema automatickou optimalizaci.
**Fix:** Zmenit na `<Image>` s `width`/`height` nebo `fill` + `sizes`. Effort: 10 min.

### 2.3 Missing `sizes` prop na Next.js Image

**Zavaznost:** STREDNI — zbytecne velke obrazky na mobilech
**Problem:** 29 souboru pouziva `<Image>`, ale pouze 18 ma `sizes` prop. Bez `sizes` Next.js posle plnou velikost i na mobil (plytva data).
**Soubory BEZ sizes (prioritni — velke obrazky):**

| Soubor | Pouziti | Doporuceny sizes |
|--------|---------|-----------------|
| `components/common/FooterBase.tsx` | Logo | `(max-width: 768px) 120px, 150px` |
| `components/inzerce/Navbar.tsx` | Logo | `40px` (fixed) |
| `components/marketplace/Navbar.tsx` | Logo | `40px` (fixed) |
| `components/shop/Navbar.tsx` | Logo | `40px` (fixed) |
| `components/admin/AdminSidebar.tsx` | Logo + avatar | `40px` |
| `components/admin/BrokerApprovalCard.tsx` | Avatar | `48px` |
| `app/(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` | Product img | `(max-width: 768px) 100vw, 50vw` |

**Fix:** Pridat `sizes` prop na vsechny Image komponenty. Effort: 25 min.

### 2.4 Z-index konzistence v PWA

**Zavaznost:** NIZKA — jen edge case
**Problem:** TopBar, BottomNav, AiAssistant FAB, InstallPrompt, modaly — vsechny `z-50`. Zpusobuje nepredvidatelne prekryvani (jiz opraveno pro DeletePartDialog → z-[60]).
**Aktualni stav:**

| Komponenta | z-index | Soubor |
|-----------|---------|--------|
| TopBar | z-50 | `components/pwa/TopBar.tsx:14` |
| BottomNav | z-50 | `components/pwa/BottomNav.tsx:123` |
| SupplierTopBar | z-50 | `components/pwa-parts/SupplierTopBar.tsx:26` |
| SupplierBottomNav | z-50 | `components/pwa-parts/SupplierBottomNav.tsx:60` |
| AiAssistant FAB | z-50 | `components/pwa/AiAssistant.tsx:163` |
| AiAssistant panel | z-50 | `components/pwa/AiAssistant.tsx:202` |
| Modaly (reject lead) | z-50 | `components/pwa/dashboard/NewLeadsSection.tsx:181` |
| ContractsList FAB | z-50 | `components/pwa/contracts/ContractsList.tsx:74` |
| InstallPrompt | z-50 | `components/pwa/InstallPrompt.tsx:64` |

**Doporucena hierarchie:**

```
z-40  — TopBar, BottomNav (fixed navigace)
z-50  — FAB buttons (AiAssistant, ContractsList, InstallPrompt)
z-[60] — Dialogy, bottom sheets, modaly
z-[70] — Full-screen overlaye (AiAssistant panel)
z-[80] — System-level (toast notifikace, pokud pribudou)
```

**Fix:** Refaktor z-indexu dle hierarchie. Effort: 30 min. **Pozor:** otestovat kazdou kombinaci (FAB + modal, TopBar + dropdown, atd).

---

## §3 STREDNI PRIORITA — Vizualni kvalita

### 3.1 Tabulky bez mobilniho fallbacku

**Zavaznost:** STREDNI — admin/backoffice stranky
**Problem:** Admin tabulky (partneri, objednavky, schvalovani) pouzivaji `<table>` bez mobilniho card-view fallbacku. Na malych obrazovkach se musi horizontalne scrollovat.
**Postizene oblasti:**
- `app/(admin)/admin/partners/page.tsx` — tabulka partneru
- `app/(admin)/admin/manager/approvals/page.tsx` — schvaleni brokeru
- `app/(admin)/admin/dashboard/page.tsx` — dashboard metriky

**Fix varianta A (rychla):** `overflow-x-auto` wrapper + `min-w-[640px]` na `<table>` → horizontal scroll s vizualnim hint (gradient fade).
**Fix varianta B (idealni):** Responsive card layout pod `md:` breakpointem. Kazdy radek → karta se stacked key-value pairs.

**Doporuceni:** Varianta A pro admin (primarne desktop), varianta B pouze pokud admin pouziva i mobil. Effort: A=15min, B=2h.

### 3.2 Landscape mode handling

**Zavaznost:** NIZKA — edge case ale profesionalni dojem
**Problem:** Zadna stranka nehandluje landscape specificky. BottomNav zabira ~15% vysky v landscape na malych zarizeni.
**Fix:**
```css
/* globals.css */
@media (orientation: landscape) and (max-height: 500px) {
  .bottom-nav-compact { height: 48px; padding-bottom: 4px; }
  .top-bar-compact { height: 40px; }
}
```
**Effort:** 30 min. Nutne otestovat na iPhone SE landscape.

### 3.3 Touch feedback na interaktivnich prvcich

**Zavaznost:** NIZKA — UX polish
**Problem:** Vetsina tlacitek ma `hover:` efekty ale ne `active:` state pro okamzitou odezvu dotyku.
**Fix:** Pridat `active:scale-95` nebo `active:bg-opacity-80` na primarne CTA buttony. Nekterym PWA komponentam uz pridano (AiAssistant FAB ma `active:scale-95`).
**Effort:** 20 min.

---

## §4 NIZKA PRIORITA — Performance & Future

### 4.1 Bundle size audit

**Zavaznost:** NIZKA — dnes neni bottleneck
**Nastroj:** `ANALYZE=true next build` (need @next/bundle-analyzer)
**Potencialni candidates pro dynamic import:**
- `framer-motion` — pouzivan v animacich, ale ne na kazde strance
- `@anthropic-ai/sdk` — AI asistent, jen v PWA
- `chart.js` / `recharts` — pokud pouzito v stats

**Fix:** Lazy import tezkeho kodu pres `next/dynamic`. Effort: 1-2h audit + implementace.
**Poznamka:** Next.js 15 automaticky code-splituje per-page, takze to nemusI byt problem.

### 4.2 Pull-to-refresh v PWA

**Zavaznost:** NIZKA — native feel
**Problem:** PWA nema pull-to-refresh. Uzivatele musi pouzit browser refresh.
**Fix:** Custom pull-to-refresh hook na dashboard stranky (makler, supplier). Effort: 2h.
**Implementace:**
```
- Touch event listener na scroll container
- Threshold: 80px pull distance
- Router.refresh() nebo invalidate specific data
- Vizualni indicator (spinner / orange bar)
```

### 4.3 Skeleton loading konzistence

**Zavaznost:** NIZKA — jiz dobre implementovano
**Stav:** 144 souboru s loading states. Vetsina pouziva skeleton/shimmer. Overit ze vsechny `loading.tsx` maji vizualne konzistentni skeletony.
**Fix:** Vizualni audit, sjednotit pulse animaci. Effort: 30 min.

### 4.4 Dark mode (budouci)

**Zavaznost:** FUTURNI — ne pro launch
**Stav:** Neni implementovan. Tailwind 4 podporuje `dark:` prefix out-of-box.
**Doporuceni:** Po launchi jako v2 feature. Vyzaduje:
- CSS variables pro barvy (misto hard-coded hex)
- `prefers-color-scheme` media query
- Toggle v nastaveni
- Test vsech 4 produktu

---

## §5 Co je uz DOBRE (neopravovat)

| Oblast | Stav | Detail |
|--------|------|--------|
| Safe area insets | VYBORNE | 23+ vyskytu `env(safe-area-inset-*)` v TopBar, BottomNav, modaly |
| Touch targets | VYBORNE | Tlacitka `h-11`/`h-12` (44-48px), vetsina splnuje WCAG 2.5.5 |
| Loading states | VYBORNE | 144 souboru s loading.tsx nebo skeleton |
| PWA manifest | KOMPLETNI | standalone, portrait, theme_color, maskable icons |
| overflow-x-hidden | OK | Root layout body ma `overflow-x-hidden` |
| Input font size | OK | `text-[15px]` — >= 16px rule pro iOS splneno (15px je edge case ale neprovokuje zoom) |
| Mobile-first breakpoints | OK | `sm:` → `md:` → `lg:` pattern konzistentne |
| Grid collapse | OK | `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` |
| Modaly | OK | `fixed inset-0` full-screen na mobilu, bottom sheet pattern |
| Offline support | VYBORNE | IndexedDB + Service Worker + background sync |
| Font loading | OK | `display: "swap"` eliminuje FOIT |

---

## §6 Core Web Vitals dopad

| Metrika | Aktualni riziko | Po opravach |
|---------|----------------|-------------|
| **LCP** | STREDNI — chybejici `sizes` prop = velke obrazky | NIZKE — spravne sizes snia payload |
| **CLS** | VYSOKE — chybejici viewport meta tag | NIZKE — viewport fix eliminuje primary CLS |
| **INP** | NIZKE — touch targets OK, event handlers OK | NIZKE — beze zmeny |
| **FCP** | NIZKE — font swap, SSR | NIZKE — beze zmeny |

---

## §7 Prioritizovany akcni plan

### Tier 1: OPRAVIT HNED (quick-wins, <1h celkem)

| # | Akce | Effort | Soubor | Impact |
|---|------|--------|--------|--------|
| A | Pridat `export const viewport` do root layout | 5 min | `app/layout.tsx` | KRITICKY — CLS, zoom, safe areas |
| B | Fix text-[10px] → text-[11px] v navigacich | 20 min | 5 souboru (viz §2.1) | VYSOKA — citelnost |
| C | Pridat `sizes` prop na Image komponenty | 25 min | 11 souboru (viz §2.3) | STREDNI — LCP, data |
| D | Nahradit `<img>` za `<Image>` v SearchOverlay | 10 min | `components/ui/SearchOverlay.tsx` | NIZKA — CLS |

### Tier 2: OPRAVIT PRED LAUNCH (kazdy <30 min)

| # | Akce | Effort | Impact |
|---|------|--------|--------|
| E | Z-index hierarchie refaktor | 30 min | STREDNI — eliminace overlay bugs |
| F | Touch feedback (active: states) | 20 min | NIZKA — UX polish |
| G | Admin tabulky overflow-x-auto | 15 min | NIZKA — admin je primarne desktop |

### Tier 3: POST-LAUNCH (vice casu, vice rizika)

| # | Akce | Effort | Blokovan? |
|---|------|--------|-----------|
| H | Landscape mode handling | 30 min | Ne |
| I | Pull-to-refresh v PWA | 2h | Ne |
| J | Bundle size audit + lazy imports | 1-2h | Ne |
| K | Admin tabulky → card view (varianta B) | 2h | Ne |
| L | Dark mode | 2 tydny+ | Ne — ale velky scope |

---

## §8 STOP pravidla pro implementatora

1. **NIKDY** nepouzij `maximum-scale=1` nebo `user-scalable=no` — porusuje WCAG
2. **NIKDY** nemen z-index na komponentech ktere nepatchujes — vyzaduje full regression test
3. `text-[10px]` v badge-counterech (kruhove cislo) je AKCEPTOVATELNE — nemenit
4. Admin tabulky: varianta A (overflow-x-auto) staci pro launch — varianta B je nice-to-have
5. Pull-to-refresh: NEPOUZIVAT `overscroll-behavior` CSS hack — nespolehlivy cross-browser. Pouzit touch event listener.
6. Pred komitem otestovat na: iPhone SE (nejmensi), iPhone 15 Pro (notch), Android (Chrome) — vsechny 3.

---

## §9 Acceptance criteria

| Kriterium | Jak overit |
|-----------|-----------|
| Viewport meta tag pritomen | View page source → `<meta name="viewport" content="width=device-width...">` |
| Zadny text pod 11px v navigacich | Vizualni kontrola BottomNav, TopBar na iPhone SE |
| Vsechny Image maji sizes | `grep -r "<Image" --include="*.tsx" -l` → kazdy ma `sizes` |
| Zadny raw `<img>` v komponentach | `grep -r "<img " --include="*.tsx" -l` vraci jen node_modules |
| Z-index hierarchie funguje | Otevrit AI asistenta + modal soucasne — spravne prekryti |
| Core Web Vitals pass | Lighthouse mobile score ≥ 90 performance |

---

## §10 Shrnuti

| Kategorie | Pocet | Stav |
|-----------|-------|------|
| Kriticke (blokuje CWV) | 1 | viewport export |
| Quick-wins (<30 min) | 4 | font size, sizes, img tag, viewport |
| Pred launch | 3 | z-index, touch, tabulky |
| Post-launch | 5 | landscape, P2R, bundle, cards, dark mode |
| Uz funguje dobre | 11 | safe areas, touch targets, loading, PWA, offline... |

**Celkovy effort Tier 1:** ~60 min
**Celkovy effort Tier 1+2:** ~2h
**Doporuceni:** Tier 1 (A-D) je BLOKUJICI pro launch — implementovat PRED deploy.

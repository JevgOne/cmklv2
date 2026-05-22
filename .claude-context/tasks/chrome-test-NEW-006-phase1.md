# Chrome Test — NEW-006 FÁZE 1: Responzivita High-Risk Stránek

**Datum:** 2026-05-05  
**Agent:** test-chrome  
**Breakpointy:** 375px (iPhone SE), 768px (iPad), 1280px (desktop)  
**Metoda:** Playwright headed + Chromium + vizuální screenshot review  
**Playwright výsledek:** 30/30 testů PASSED ✅

---

## Výsledková tabulka

| Status | # | URL | Breakpoint | Popis | Priorita |
|--------|---|-----|-----------|-------|---------|
| ✅ PASS | 1 | `/` (homepage) | 375px | Hero stacks to single col, text čitelný, hamburger viditelný | — |
| ✅ PASS | 1 | `/` (homepage) | 768px | Hero stacked (lg:grid-cols-2 kickuje na 1024px+), CTA tlačítka ≥44px | — |
| ✅ PASS | 1 | `/` (homepage) | 1280px | Desktop 2-col hero, full nav bar, grid sections správně | — |
| ✅ PASS | 2 | `/nabidka` | 375px | Chips filtry scrollují horizontálně v kontejneru, grid 1-col | — |
| ✅ PASS | 2 | `/nabidka` | 768px | 2-col grid, inline "Filtry" button, cookies banner nepřekrývá | — |
| ✅ PASS | 2 | `/nabidka` | 1280px | 3-col grid, inline filter row (značka, cena, palivo…), správně | — |
| ✅ PASS | 3 | `/nabidka/porovnani` | 375px | Prázdný stav — CTA "Prohlédnout nabídku" správně, tabulka má `overflow-x-auto` wrapper | — |
| ✅ PASS | 3 | `/nabidka/porovnani` | 768px | OK | — |
| ✅ PASS | 3 | `/nabidka/porovnani` | 1280px | OK | — |
| ✅ PASS | 4 | `/shop/kosik` | 375px | Prázdný košík — EmptyState centrovaný, CTA ≥44px, žádný overflow | — |
| ✅ PASS | 4 | `/shop/kosik` | 768px | OK | — |
| ✅ PASS | 4 | `/shop/kosik` | 1280px | OK | — |
| ✅ PASS | 5 | `/dily/objednavka` | 375px | Prázdný košík state — grid 1-col, žádný overflow | — |
| ✅ PASS | 5 | `/dily/objednavka` | 768px | OK | — |
| ✅ PASS | 5 | `/dily/objednavka` | 1280px | OK | — |
| ⚠️ REDIRECT | 6 | `/makler/vehicles/new` | 375px | Auth guard → /login?callbackUrl=... — login form OK na mobile | — |
| ⚠️ REDIRECT | 6 | `/makler/vehicles/new` | 768px | Auth guard → login OK | — |
| ⚠️ REDIRECT | 6 | `/makler/vehicles/new` | 1280px | Auth guard → login OK | — |
| ⚠️ REDIRECT | 7 | `/makler/contracts` | 375px | Auth guard → /login — login form OK | — |
| ⚠️ REDIRECT | 7 | `/makler/contracts` | 768px | OK | — |
| ⚠️ REDIRECT | 7 | `/makler/contracts` | 1280px | OK | — |
| ⚠️ REDIRECT | 8 | `/admin/dashboard` | 375px | Auth guard → /login — login form OK | — |
| ⚠️ REDIRECT | 8 | `/admin/dashboard` | 768px | OK | — |
| ⚠️ REDIRECT | 8 | `/admin/dashboard` | 1280px | OK | — |
| ⚠️ REDIRECT | 9 | `/admin/vehicles` | 375px | Auth guard → /login — login form OK | — |
| ⚠️ REDIRECT | 9 | `/admin/vehicles` | 768px | OK | — |
| ⚠️ REDIRECT | 9 | `/admin/vehicles` | 1280px | OK | — |
| ✅ PASS | 10 | `/blog` | 375px | 1-col layout, featured image škáluje správně, text čitelný | — |
| ✅ PASS | 10 | `/blog` | 768px | Featured article 2-col (obr+text), kategorie sidebar schovány | — |
| ✅ PASS | 10 | `/blog` | 1280px | 3-col grid + kategorie sidebar, správné škálování obrázků | — |

---

## Detailní findings per stránka

### 1. Homepage `/` — ✅ PASS

**375px:** Hero titulka se zalamuje na 3 řádky (normální pro šířku 375px), CTA tlačítka "Koupit auto" / "Prodat auto" jsou tapovatelná, hamburger je v pravém rohu. Cookie banner nepřekrývá CTA. Žádný horizontální scroll.

**768px:** Hamburger menu stále viditelný (desktop nav se zobrazuje na 1024px+). Hero text na jednom řádku — hezky čitelný. CTA tlačítka velká, tapovatelná.

**1280px:** Plný desktop layout — 2-sloupcový hero (text vlevo, obrázek vpravo), full nav bar s dropdown menu, cards sekce správně.

**Kód:** `grid lg:grid-cols-2` správně stacks. Všechny gridy mají responsive varianty (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`). ✅

---

### 2. Katalog `/nabidka` — ✅ PASS

**375px:** Filter chips row horizontálně scrolluje uvnitř kontejneru (správné chování). "Filtry" tlačítko a sort dropdown pod ním — tapovatelné. Grid 1-col, karty správně. Žádný overflow stránky.

**768px:** Chips row = více chipů viditelných najednou. "Vložit inzerát zdarma" button správně right-aligned. 2-col karty grid.

**1280px:** Inline filter row (Všechny značky, Cena od/do, Palivo, Převodovka, Karoserie, Rok od/do, Prodejce + Hledat). Správně 3-col grid. Žádný přetok.

**Poznámka:** Filter panel se rozbaluje jako inline sekce (ne sidebar) — responsivní přístup správný. ✅

---

### 3. Porovnání vozidel `/nabidka/porovnani` — ✅ PASS

**375px:** Prázdný stav — centrovaná ikonka vah, text, CTA tlačítko. Tapovatelné ✅.

**Kód:** `CompareTable` má wrapper `<div className="overflow-x-auto -mx-4 px-4">` a tabulka má `min-w-[640px]` — správně bude horizontálně scrollovat uvnitř wrapperu když jsou vozidla přidána. ✅ Playwright potvrdil: `tables wrapped in overflow-x-auto: true`.

---

### 4. Košík `/shop/kosik` — ✅ PASS

**375px:** Prázdný košík EmptyState — ikona košíku, text, oranžové CTA "Procházet katalog". Vše centrované, tapovatelné. 

**Poznámka při prvním testu:** V 1. průchodu se zobrazil Next.js dev overlay "1 Issue ×" — jednalo se o transientní hydration warning, při opakovaném testu se neobjevil. Žádný produkční problém.

**Kód:** Layout košíku s položkami používá flex card layout (ne tabulku) — `flex gap-4` + `flex-1 min-w-0`. Grid summary: `grid-cols-1 lg:grid-cols-3`. Správně responsive. ✅

---

### 5. Checkout `/dily/objednavka` — ✅ PASS

**375px:** Prázdný košík state (bez dílů v košíku) — prázdný stav zobrazen správně. Form grid `grid-cols-1 lg:grid-cols-3` ✅.

**Poznámka:** Checkout formulář s adresou/dopravou/platbou testován jen strukturálně (prázdný košík). Pro úplný test formulářů je potřeba přidat díly do košíku.

---

### 6–9. Auth-protected stránky — ⚠️ REDIRECT (nelze bez credentials)

Všechny chráněné stránky správně přesměrovávají na `/login?callbackUrl=...`:
- `/makler/vehicles/new` → `/login`
- `/makler/contracts` → `/login`
- `/admin/dashboard` → `/login`
- `/admin/vehicles` → `/login`

**Login stránka responsivita ✅:** Centred card layout, input fields plná šířka, tapovatelné. Žádný overflow na žádném breakpointu.

**Co NEBYLO testováno (vyžaduje auth):**
- Admin DataTable s reálnými daty a mnoha sloupci
- Admin sidebar overlay toggle na mobile
- Vehicle wizard (krokový formulář + foto upload)
- SignatureCanvas touch podpis

→ **Doporučuji: Fáze 2 testování s testovacími přihlašovacími údaji pro role ADMIN a BROKER.**

---

### 10. Blog `/blog` — ✅ PASS

**375px:** Featured article jako 1-col (obrázek přes celou šířku), text pod ním. Obrázky se škálují. Playwright: žádné obrázky přetékající viewport.

**768px:** Featured article ve 2-col (obrázek vlevo, text vpravo). Další karty v 2-col gridu. Kategorie sidebar schovány (zobrazují se jen na desktop).

**1280px:** Featured 2-col, 3-col grid karet + kategorie sidebar vpravo. Správné Next.js `<Image>` komponenty se správným škálováním.

---

## Kódový audit — klíčové komponenty

| Komponenta | Soubor | Responsivita | Status |
|-----------|--------|-------------|--------|
| `DataTable` | `components/admin/DataTable.tsx:18` | `overflow-x-auto` wrapper | ✅ |
| `CompareTable` | `app/(web)/nabidka/porovnani/CompareTable.tsx:179` | `overflow-x-auto -mx-4 px-4` | ✅ |
| `AdminSidebar` | `components/admin/AdminSidebar.tsx:141-143` | `max-lg:-translate-x-full`, overlay backdrop | ✅ |
| `AdminLayout` | `components/admin/AdminLayout.tsx:25` | `lg:ml-[280px]` content offset | ✅ |
| Košík layout | `app/(web)/shop/kosik/page.tsx:61` | `grid-cols-1 lg:grid-cols-3` | ✅ |
| Nabídka grid | `app/(web)/nabidka/page.tsx:287` | `grid-cols-1 md:cols-2 lg:cols-3` | ✅ |
| Homepage hero | `app/(web)/page.tsx:254` | `grid lg:grid-cols-2` | ✅ |

---

## Shrnutí

**Veřejně přístupné stránky (6/6 testováno):**
- Žádný horizontální overflow na žádné ze 6 stránek × 3 breakpointy (18 kombinací)
- Všechny klíčové komponenty mají správné responsive varianty
- Tabulky mají overflow-x-auto wrappery

**Auth-chráněné stránky (4/4 nelze testovat bez credentials):**
- Login redirect správně funguje a je responsivní
- Kódový audit ukazuje správnou implementaci (overlay sidebar, lg:ml-280px)
- Potřeba Fáze 2 testování s auth

**Kritické problémy:** ŽÁDNÉ  
**P1 problémy:** ŽÁDNÉ  
**P2 problémy:** ŽÁDNÉ  
**P3 problémy:** ŽÁDNÉ  

**Doporučení pro Fáze 2:**
1. Testovat admin/PWA stránky s přihlášením (ADMIN role)
2. Testovat košík s reálnými položkami (přidat díly → checkout flow)
3. Testovat CompareTable s 2-3 vozidly přidanými k porovnání
4. Testovat SignatureCanvas touch na simulovaném mobile device

---

*Screenshoty uloženy v: `e2e/screenshots/` (30 PNG souborů)*  
*Playwright spec: `e2e/chrome-test-NEW-006-phase1.spec.ts`*

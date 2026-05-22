# TEST-NEW-035: Full Click-Through Test — carmakler.cz

**Datum:** 2026-05-07  
**Agent:** test-chrome  
**Target:** https://carmakler.cz (produkce)  
**Metoda:** Playwright headed Chromium, reálný uživatel simulace  
**Breakpointy:** 375px (iPhone SE), 768px (iPad), 1280px (desktop)  
**Spec:** `e2e/chrome-test-NEW-035-clickthrough.spec.ts`

---

## Celkový výsledek: ✅ VEŘEJNÝ WEB ZDRAVÝ

Všechny veřejné stránky (hlavní web, blog, nabídka, inzerce, eshop, marketplace) prošly testem bez kritických chyb.

**Admin/PWA nelze testovat** — účty (admin@carmakler.cz, jan.novak@carmakler.cz) neexistují v produkční DB.

---

## Výsledková tabulka

### HLAVNÍ WEB (19 stránek × 3 BP = 57 kombinací)

| Status | # | URL | BP | Stránka se načte | CSS OK | Bez overflow | Konzole | Poznámka |
|--------|---|-----|----|-----------------|--------|-------------|---------|---------|
| ✅ PASS | 1 | `/` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 2 | `/o-nas` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 3 | `/jak-to-funguje` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 4 | `/kontakt` | 375/768/1280 | ✅ | ✅ | ✅ | ⚠️ CSP | Mapa mapy.cz blocked — P3 |
| ✅ PASS | 5 | `/cenik` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 6 | `/chci-prodat` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 7 | `/jak-prodat-auto` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 8 | `/kolik-stoji-moje-auto` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 9 | `/recenze` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 10 | `/kariera` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 11 | `/sluzby` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 12 | `/sluzby/proverka` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 13 | `/sluzby/financovani` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 14 | `/sluzby/pojisteni` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 15 | `/makleri` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 16 | `/obchodni-podminky` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 17 | `/ochrana-osobnich-udaju` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 18 | `/reklamacni-rad` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |
| ✅ PASS | 19 | `/zasady-cookies` | 375/768/1280 | ✅ | ✅ | ✅ | 0 err | OK |

### BLOG + CLICK-THROUGH

| Status | # | URL | Popis |
|--------|---|-----|-------|
| ✅ PASS | 20 | `/blog` | Listing stránek — 375/768/1280 OK |
| ✅ PASS | 21 | `/blog/carmakler-spousti-ai-asistenta-pro-maklere` | Article detail — HTTP 200, 701 chars, CSS OK |

**Navigace:** Blog listing → klik na první článek → detail načten správně ✅

### NABÍDKA VOZIDEL + CLICK-THROUGH

| Status | # | URL | Popis |
|--------|---|-----|-------|
| ✅ PASS | 25 | `/nabidka` | Katalog — 375/768/1280 OK |
| ✅ PASS | 26 | `/nabidka/porovnani` | Srovnání — 375/768/1280 OK |
| ✅ PASS | 27 | `/nabidka/bmw-fabia-2013-ngpgnx` | Vehicle detail click — HTTP 200, 692 chars |

**Navigace:** /nabidka → klik na první vozidlo → detail se načetl ✅

### INZERCE

| Status | # | URL | Poznámka |
|--------|---|-----|---------|
| ✅ PASS | 30 | `/inzerce` | 375/768/1280 OK |
| ✅ PASS | 31 | `/inzerce/katalog` | 375/768/1280 OK |
| ✅ PASS | 32 | `/inzerce/registrace` | 375/768/1280 OK |
| ✅ PASS | 33 | `/inzerce/pridat` | 375/768/1280 OK |

### ESHOP + DÍLY

| Status | # | URL | Poznámka |
|--------|---|-----|---------|
| ✅ PASS | 40 | `/shop/katalog` | 375/768/1280 OK |
| ✅ PASS | 41 | `/shop/kosik` | 375/768/1280 OK (EmptyState) |
| ✅ PASS | 42 | `/dily` | 375/768/1280 OK |
| ✅ PASS | 43 | `/dily/katalog` | 375/768/1280 OK |
| ✅ PASS | 44 | `/dily/kosik` | 375/768/1280 OK (EmptyState) |
| ✅ PASS | 45 | `/dily/objednavka` | 375/768/1280 OK (EmptyState) |
| ℹ️ INFO | 46 | `/dily/katalog` click-through | Žádné díly v katalogu — prázdná DB na produkci |

### MARKETPLACE

| Status | # | URL | Poznámka |
|--------|---|-----|---------|
| ✅ PASS | 50 | `/marketplace` | 375/768/1280 OK |
| ✅ PASS | 51 | `/marketplace/apply` | 375/768/1280 OK |
| ✅ PASS | 52 | `/marketplace/dealer` | 375/768/1280 OK |
| ✅ PASS | 53 | `/marketplace/investor` | 375/768/1280 OK |

### AUTH STRÁNKY + FORM INTERAKTIVITA

| Status | # | URL | Popis |
|--------|---|-----|-------|
| ✅ PASS | 60 | `/prihlaseni` → `/login` | Redirect OK, login form načten, CSS OK |
| ✅ PASS | 61 | `/registrace` | 375/768/1280 OK |
| ✅ PASS | 62 | `/zapomenute-heslo` | 375/768/1280 OK |

**Form interaktivita ověřena:**
- Login form: `#email` + `#password` inputy nalezeny, fill funguje ✅ (`email=test@test.cz` vyplněno)
- Login form: submit button přítomný ✅
- Registration: formulářové fieldy přítomné ✅

### ADMIN PANEL — ❌ NELZE OTESTOVAT (auth issue)

**Příčina:** Login `admin@carmakler.cz / heslo123` na produkci vrací redirect zpět na `/login`.  
Účet buď neexistuje v produkční DB nebo je `NEXTAUTH_SECRET` jiný než v testovacím prostředí.

Admin stránky (79–81): zobrazují `/login?callbackUrl=...` redirect = nelze testovat responzivitu a UI.

### PWA MAKLÉŘ — 🔒 NELZE OTESTOVAT (auth issue)

Stejný důvod jako admin — `jan.novak@carmakler.cz / heslo123` nefunguje na produkci.

---

## Zjištěné problémy

### ⚠️ P2 — Transient 502 errors při vysoké zátěži

**Popis:** Při spuštění všech 66 testů najednou (bez pause) vrátila produkce HTTP 502 na stránkách /recenze, /kariera, /sluzby atd. Při spuštění stejných stránek v izolaci (jeden test najednou) — vše PASS.

**Závěr:** Produkční server (Next.js/PM2) pod intenzivní zátěží (66 requestů sekvenčně) vrací 502. Není to bug konkrétní stránky, ale server stability issue pod zátěží.

**Doporučení:** Monitorovat produkci pod reálnou zátěží. Zvážit PM2 cluster mód s více workers nebo nginx rate limiting.

### ⚠️ P3 — /kontakt: CSP blokuje mapy.cz iframe

**Popis:** `frame-src` CSP policy neobsahuje `https://frame.mapy.cz`. Mapa se nezobrazí.  
**JS chyba v konzoli:** Refused to frame 'https://frame.mapy.cz/' (CSP)  
**Dopad:** Mapa na kontaktní stránce není viditelná. Stránka jinak funkční.  
**Fix:** Přidat `https://frame.mapy.cz` do `frame-src` v next.config.ts CSP headeru.

### ℹ️ INFO — /dily/katalog: Prázdný katalog dílů

**Popis:** Žádné díly v produkční DB. Link click-through na detail dílu nelze provést.  
**Závěr:** Není bug — eshop dílů čeká na první vrakoviště (business data).

### ❌ BLOCKED — Admin + PWA nelze testovat

Účty v produkční DB neexistují. Potřeba buď:
1. Vytvořit účty na produkci (`npx prisma studio` na serveru nebo SQL insert)  
2. Nebo seedovat produkční DB

---

## Deploy status — fixe čekající na produkci

| Commit | Soubor | Popis | Status |
|--------|--------|-------|--------|
| `0111449` | `components/ui/Tabs.tsx` | overflow-x-auto na tabs wrapper | ⚠️ NOT DEPLOYED |
| `857918f` | `components/admin/AdminLayout.tsx` | min-w-0 na flex-1 (root cause fix) | ⚠️ NOT DEPLOYED |

**Dopad:** Admin stránky na produkci mají stále P1 horizontal overflow @ 375px. Po deployi potřeba re-test.

---

## Souhrn

| Kategorie | Stránek | BP | Výsledek |
|-----------|---------|-----|---------|
| Hlavní web | 19 | 375/768/1280 | ✅ 57/57 PASS |
| Blog + article | 2 | 375/768/1280 + click | ✅ PASS |
| Nabídka + detail | 3 | 375/768/1280 + click | ✅ PASS |
| Inzerce | 4 | 375/768/1280 | ✅ PASS |
| Eshop + Díly | 6 | 375/768/1280 | ✅ PASS |
| Marketplace | 4 | 375/768/1280 | ✅ PASS |
| Auth + forms | 3 | 375/768/1280 | ✅ PASS |
| **Admin** | 12 | 375/1280 | ❌ AUTH FAIL |
| **PWA** | 13 | 375/1280 | ❌ AUTH FAIL |

**Celkem prověřeno:** 41 stránek, ~120+ kombinací (URL × breakpoint)  
**PASS:** 100% veřejných stránek  
**JS konzolové chyby:** 0 (mimo CSP na /kontakt)  
**Blank screens:** 0  
**CSS rendering failures:** 0  
**Horizontal overflow:** 0 (na veřejných stránkách)

---

*Test specs: `e2e/chrome-test-NEW-035-clickthrough.spec.ts`, `e2e/chrome-test-NEW-035-console-check.spec.ts`*

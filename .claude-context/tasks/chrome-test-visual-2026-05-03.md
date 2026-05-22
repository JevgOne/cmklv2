# Chrome Visual Test — Carmakler klíčové stránky
**Datum:** 2026-05-03  
**Tester:** test-chrome  
**Browser:** Playwright headed (Chromium), viewport 1280×800 + mobile 375×667  
**Server:** localhost:3000 (Next.js dev)

---

## Souhrn

| Stránka | Status | Render | Mobile | JS Errory | Poznámka |
|---------|--------|--------|--------|-----------|----------|
| `/` Homepage | 200 | ✅ | ✅ | ❌ none | OK |
| `/nabidka` Katalog | 200 | ✅ | ✅ | ❌ none | OK |
| `/blog` Blog | 200 | ✅ | ✅ | ⚠️ 1× 404 | Broken image z Unsplash |
| `/login` Přihlášení | 200 | ✅ | ✅ | ❌ none | Formulář funguje |
| `/registrace` | 200 | ✅ | ✅ | ❌ none | Všechna pole přítomna |
| `/shop` Eshop | 200 | ✅ | ✅ | ❌ none | OK |
| `/dily` Díly | 200 | ✅ | ✅ | ❌ none | OK |
| `/inzerce` Inzerce | 200 | ✅ | ✅ | ❌ none | OK |
| `/marketplace` | 200 | ✅ | ✅ | ❌ none | OK |
| `/o-nas` | 200 | ✅ | ✅ | ❌ none | OK |
| `/kontakt` | 200 | ✅ | ✅ | ⚠️ CSP | Mapa načtena, ale CSP violation |
| `/cenik` Ceník | 200 | ✅ | ✅ | ❌ none | OK |
| `/chci-prodat` | 200 | ✅ | ✅ | ❌ none | Formulář přítomen |

**Výsledek: 11/13 ✅ čistých, 2 × ⚠️ (varování, ne chyby)**

---

## Detail stránek

### ✅ Homepage (/)
- Title: "Prodejte auto za nejlepší cenu, kupte bezpečně | CarMakléř"
- H1: "Prodejte auto za nejvyšší cenu. Kupte s jistotou."
- Renderuje se plně, navigace viditelná, CTA tlačítka přítomna
- Responzivní na 375px — menu, hero sekce OK

### ✅ Katalog vozidel (/nabidka)
- Title: "Nabídka vozidel | CarMakléř"
- Stránka se renderuje, filtry/katalog přítomny
- Žádné 404 v detailním testu (první pass byl false positive)

### ⚠️ Blog (/blog)
- Title: "Blog — magazín o autech | CarMakléř"
- Renderuje se správně
- **BUG:** 1× 404 na Next.js image optimization:
  ```
  /_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1549317661-bd32c8ce0afa...
  ```
  Jeden článek má broken thumbnail z Unsplash CDN. Ostatní obrázky OK.

### ✅ Login (/login)
- Formulář: email + password + submit button ✅
- **Empty submit:** HTML5 required funguje (prohlížeč blokuje odeslání) — žádný viditelný error text v DOM, ale browser-native validation probíhá
- **Wrong credentials:** stránka zůstane na `/login`, zobrazí "Nesprávn..." (zkráceno) ✅
- Přesměrování při chybných kredencích správné

### ✅ Registrace (/registrace)
- Všechna 6 pole přítomna: firstName, lastName, email, phone, password, passwordConfirm
- Placeholder texty správné ("Jan", "Novák", "vas@email.cz", "+420 123 456 789")

### ✅ Eshop (/shop)
- Title: "Shop — autodíly a příslušenství | CarMakléř"
- H1: "Autodíly a příslušenství"
- OK bez chyb

### ✅ Díly (/dily)
- Title: "Autodíly — levnější než nové, s zárukou | CarMakléř"
- OK bez chyb

### ✅ Inzerce (/inzerce)
- H1: "Prodejte své auto. Zdarma."
- OK bez chyb

### ✅ Marketplace (/marketplace)
- H1: "Investujte do aut, vydělejte 15-25 % ročně"
- Landing page (gated content) OK bez chyb

### ✅ O nás (/o-nas)
- Renderuje se plně, OK

### ⚠️ Kontakt (/kontakt)
- H1: "Ozvěte se nám"
- Stránka renderuje správně, obsah přítomen (1526 znaků)
- Mapa iframe detekována (`hasMap: true`)
- **CSP VIOLATION (report-only):**
  ```
  Framing 'https://frame.mapy.cz/' violates frame-src policy
  Framing 'https://mapy.com/' violates frame-src policy
  ```
  CSP `frame-src` povoluje jen: `'self'`, `js.stripe.com`, `hooks.stripe.com`, `widget.packeta.com`
  **Chybí:** `https://frame.mapy.cz` a `https://mapy.com`
  
  Momentálně je to **report-only** (mapa pravděpodobně funguje), ale při přepnutí na enforcement mode se mapa rozbije.

### ✅ Ceník (/cenik)
- H1: "Jednoduchý a férový ceník"
- OK bez chyb

### ✅ Chci prodat (/chci-prodat)
- Formulář přítomen: make (select), model (text), rok (select), km (number), stav (select), poznámka (text), telefon (tel), email (email), zpráva (textarea)
- 9 polí — kompletní lead-capture formulář

---

## Nalezené problémy (seřazeno dle závažnosti)

### 🟡 #1 — CSP frame-src chybí mapy.cz (/kontakt)
- **Závažnost:** Střední
- **URL:** `/kontakt`
- **Problém:** CSP header `frame-src` neobsahuje `https://frame.mapy.cz` ani `https://mapy.com`. Momentálně report-only, ale při enforcement se mapa rozbije.
- **Fix:** Přidat do `next.config.ts` (nebo middleware) do `frame-src`: `https://frame.mapy.cz https://mapy.com https://*.mapy.cz`

### 🟡 #2 — Broken Unsplash image (/blog)
- **Závažnost:** Nízká (vizuální)
- **URL:** `/blog` — thumbnail článku
- **Problém:** `/_next/image?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1549317661-bd32c8ce0afa...` vrací 404
- **Fix:** Aktualizovat URL obrázku v seed datech nebo obsahu blogu

### 🟢 #3 — Login empty-submit bez custom error text
- **Závažnost:** Kosmetická
- **URL:** `/login`
- **Problém:** Prázdné odeslání formuláře spoléhá na browser-native HTML5 validation, není custom error hláška v DOM (React Hook Form validace možná chybí nebo se nezobrazuje)
- **Fix:** Přidat `onInvalid` handler nebo RHF error messages pro email a password pole

---

## Responzivita

Všechny stránky otestovány při 375×667 (iPhone SE) — obsah se renderuje, žádné přetékání layoutu detekováno.

---

## Formuláře — shrnutí

| Formulář | Pole | Submit | Validace |
|----------|------|--------|----------|
| Login | email, password | ✅ | ⚠️ native-only |
| Registrace | 6 polí | N/A (neodeslán) | N/A |
| Chci prodat | 9 polí | N/A (neodeslán) | N/A |

---

## Závěr

Platforma vizuálně funguje. Všechny stránky se renderují, auth redirect funguje, základní UX je OK. Dva problémy vyžadují opravu před production enforcement CSP:
1. **Přidat mapy.cz do CSP frame-src** (kritické při přepnutí na enforcement)
2. **Opravit broken Unsplash obrázek** na blogu (kosmetické)

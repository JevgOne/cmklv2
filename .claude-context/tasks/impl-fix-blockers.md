# Implementace: Fix 3 blockerů + Marketplace v navbaru

**Datum:** 2026-04-05
**Agent:** Implementátor
**Task:** #6

---

## 1. REGIONAL_DIRECTOR redirect loop — OPRAVENO

**Soubor:** `middleware.ts:6`
**Změna:** Přidán `REGIONAL_DIRECTOR` do `ADMIN_ROLES`

```diff
- const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER"];
+ const ADMIN_ROLES = ["ADMIN", "BACKOFFICE", "MANAGER", "REGIONAL_DIRECTOR"];
```

**Důvod:** REGIONAL_DIRECTOR se po loginu redirectoval na `/admin/dashboard`, ale middleware ho nepouštěl (nebyl v ADMIN_ROLES) → nekonečný redirect loop.

---

## 2. Právní stránky bez diakritiky — OPRAVENO (4 soubory)

Kompletní přepis textového obsahu se správnou českou diakritikou:

### 2a. `app/(web)/reklamacni-rad/page.tsx`
- Všechny sekce (1–10) přepsány s háčky a čárkami
- Opraveny: "Obecna ustanoveni" → "Obecná ustanovení", "zarucni doby" → "záruční doby", "uplatneni reklamace" → "uplatnění reklamace", atd.
- **TODO na řádku 275 ODSTRANĚN** — nahrazeno textem: "Vzorový formulář pro odstoupení od smlouvy je ke stažení v sekci „Moje objednávky" po přihlášení, nebo nás kontaktujte e-mailem."

### 2b. `app/(web)/obchodni-podminky/page.tsx`
- Všechny sekce (1–11) přepsány s háčky a čárkami
- Opraveny i překlepy: "porousuje" → "porušuje", "vytvrareni" → "vytváření", "prislunymi" → "příslušnými"

### 2c. `app/(web)/ochrana-osobnich-udaju/page.tsx`
- Všechny sekce (1–10) přepsány s háčky a čárkami
- Včetně tabulky účelů zpracování (9 řádků)

### 2d. `app/(web)/zasady-cookies/page.tsx`
- Textový obsah přepsán s háčky a čárkami
- Cookies data array — všechny purpose/type hodnoty s diakritikou
- Opraveno: "vylednym souhlasem" → "výslovným souhlasem" (překlep)
- Type comparisons v JSX aktualizovány: "Nutne" → "Nutné", "Analyticke" → "Analytické"

---

## 3. TODO viditelný uživatelům — ODSTRANĚN

**Soubor:** `app/(web)/reklamacni-rad/page.tsx` (dříve řádek 275)
**Změna:** `[TODO: pridat odkaz na PDF po implementaci]` nahrazeno reálným textem viz 2a výše.

---

## 4. Marketplace v desktop navbaru — PŘIDÁNO

### 4a. `components/main/Navbar.tsx`
- Přidán odkaz na Marketplace mezi "Shop" a "Služby" dropdown
- Použit `urls.marketplace("/")` pro správné URL (subdoména)

### 4b. `components/web/Navbar.tsx`
- Přidán import `{ urls } from "@/lib/urls"`
- Přidán odkaz na Marketplace mezi "Shop" a "Služby" dropdown
- Použit `urls.marketplace("/")` pro správné URL (subdoména)

---

## Build

```
✓ Compiled successfully in 17.7s
0 errors
```

---

## Souhrn změněných souborů

| Soubor | Typ změny |
|--------|-----------|
| `middleware.ts` | +REGIONAL_DIRECTOR do ADMIN_ROLES |
| `app/(web)/reklamacni-rad/page.tsx` | Kompletní přepis diakritiky + odstranění TODO |
| `app/(web)/obchodni-podminky/page.tsx` | Kompletní přepis diakritiky + oprava překlepů |
| `app/(web)/ochrana-osobnich-udaju/page.tsx` | Kompletní přepis diakritiky |
| `app/(web)/zasady-cookies/page.tsx` | Kompletní přepis diakritiky + oprava překlepu |
| `components/main/Navbar.tsx` | Přidán Marketplace odkaz |
| `components/web/Navbar.tsx` | Přidán Marketplace odkaz + import urls |

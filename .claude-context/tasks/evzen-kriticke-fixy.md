# Evžen Review — Kritické fixy

**Datum:** 2026-04-12
**Reviewer:** Evžen THE KING
**Task:** #44
**Commit:** 5a79d3d
**Zadání:** Audit odhalil 2 kritické + 3 tier-1 problémy, uživatel řekl "pokračuj v opravách"

---

## VERDIKT: ✅ SCHVÁLENO — 5/5 fixů ověřeno, žádný scope creep

---

## 1. Kontrolní body

### Fix 1: Placeholder obrázek ✅

- `public/images/placeholder-car.jpg` — 4 308 bytes, 600x400px
- Obsah: šedé pozadí, ikona fotoaparátu, text "Foto připravujeme"
- Grep `placeholder-car` v `*.{ts,tsx}`: **7 souborů** jej referencuje — potvrzeno že chyběl
- Soubory: page.tsx (homepage), nabidka/, inzerce/, makler/, porovnani/, similar API

### Fix 2: Logo URL ✅

- `lib/company-info.ts:43` — `logo.svg` → `logo-color.png`
- `public/brand/logo-color.png` — soubor existuje ✅
- Staré `logo.svg` nikdy neexistovalo (dle auditu) — fix je korektní

### Fix 3: Orphan soubory smazány ✅

- Smazáno 3 soubory, 435 řádků mrtvého kódu:
  - `components/web/Navbar.tsx` (211 lines) — DELETED
  - `components/web/MobileMenu.tsx` (197 lines) — DELETED
  - `components/web/Footer.tsx` (27 lines) — DELETED
- Grep `from.*components/web/(Navbar|Footer|MobileMenu)` v `*.{ts,tsx}`: **0 importů** ✅
- Nahrazeny komponentami v `components/main/` (dle auditu)

### Fix 4: Zastaralý komentář smazán ✅

- `lib/company-info.ts` — odstraněn blokový komentář "POZNAMKA: Odebrat fiktivní pobočky Brno a Ostrava"
- 5 řádků smazáno, žádná funkční změna

### Fix 5: Foto auto-checks zapojeny ✅

- `VehicleDetailHub.tsx:339-341` — 3 nové auto-check keys:
  - `hasExteriorPhotos: vehicle.images.length >= 8`
  - `hasInteriorPhotos: vehicle.images.length >= 13`
  - `hasEvidencePhotos: vehicle.images.length >= 16`
- Count-based heuristic (komentář vysvětluje: VehicleImage nemá category field)
- Řeší doporučení z mého předchozího review (Task #40) ✅

---

## 2. Soubory — souhrn

| Akce | Soubor | Změna |
|------|--------|-------|
| NEW | `public/images/placeholder-car.jpg` | 600x400 placeholder (4.3 KB) |
| EDIT | `lib/company-info.ts` | logo.svg→logo-color.png + smazán komentář |
| EDIT | `components/pwa/vehicles/VehicleDetailHub.tsx` | +3 foto auto-check keys |
| DELETE | `components/web/Navbar.tsx` | 211 lines orphan |
| DELETE | `components/web/MobileMenu.tsx` | 197 lines orphan |
| DELETE | `components/web/Footer.tsx` | 27 lines orphan |

**6 souborů, +5/-441 lines**

---

## 3. Scope creep kontrola

- ✅ Žádné dotčení DB schema
- ✅ Žádné dotčení middleware/auth
- ✅ Žádné dotčení API routes (kromě auto-checks v komponentě)
- ✅ Pouze opravy identifikované auditem

---

## Celkový souhrn

| Fix | Verdikt |
|-----|---------|
| 1. Placeholder image | ✅ (existuje, 7 souborů jej referencuje) |
| 2. Logo URL | ✅ (logo-color.png existuje, logo.svg nikdy neexistovalo) |
| 3. Orphan cleanup | ✅ (3 soubory, 0 importů, 435 lines mrtvého kódu) |
| 4. Zastaralý komentář | ✅ (smazán, žádná funkční změna) |
| 5. Foto auto-checks | ✅ (count-based heuristic, řeší gap z review #40) |

### ✅ SCHVÁLENO — Kritické fixy připraveny k deploy

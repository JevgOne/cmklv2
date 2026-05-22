# Implementace: Kritické + Tier 1 opravy

**Task:** #43
**Audit:** audit-remaining-fixes.md
**Status:** HOTOVO
**Date:** 2026-04-12
**Commit:** 5a79d3d

---

## Změny

### 1. KRITICKÉ: placeholder-car.jpg (NOVÝ)

| Soubor | Popis |
|--------|-------|
| `public/images/placeholder-car.jpg` | 600x400 šedý placeholder s ikonou fotoaparátu + text "Foto připravujeme". Generováno Sharp ze SVG. |

Používáno na 10+ místech (nabídka, katalog, porovnání, similar vehicles API).

### 2. KRITICKÉ: logo URL fix

| Soubor | Změna |
|--------|-------|
| `lib/company-info.ts:43` | `logo.svg` → `logo-color.png` (SVG nikdy neexistovalo) |

Opravuje JSON-LD schema na homepage a /o-nas.

### 3. Orphan cleanup (SMAZÁNO)

| Soubor | Nahrazeno |
|--------|-----------|
| `components/web/Navbar.tsx` | `components/main/Navbar.tsx` |
| `components/web/Footer.tsx` | `components/main/Footer.tsx` |
| `components/web/MobileMenu.tsx` | `components/main/MobileMenu.tsx` |

441 řádků smazáno, 0 importů rozbito.

### 4. Zastaralý komentář smazán

| Soubor | Změna |
|--------|-------|
| `lib/company-info.ts:52-56` | Odstraněn komentář "Odebrat fiktivní pobočky Brno a Ostrava" — pobočky už jsou jen Praha |

### 5. Foto auto-check keys wired

| Soubor | Změna |
|--------|-------|
| `components/pwa/vehicles/VehicleDetailHub.tsx` | Přidány 3 auto-check keys do WorkflowChecklist |

Count-based heuristic (VehicleImage nemá `category` pole):
- `hasExteriorPhotos`: `images.length >= 8`
- `hasInteriorPhotos`: `images.length >= 13`
- `hasEvidencePhotos`: `images.length >= 16`

Pro přesné category-based auto-checks by bylo potřeba přidat `category String?` do modelu VehicleImage.

---

## Build

- `npm run build` — PASS
- TypeScript errors: **0** (jen pre-existing e2e test error)
- Žádný obsah z Autorro

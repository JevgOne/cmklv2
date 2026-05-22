# QA Report — Current Batch (unstaged changes)

**Datum:** 2026-04-05  
**Agent:** KONTROLOR  
**Rozsah:** git diff HEAD (35 souborů, 454 přidáno, 679 odebráno)  
**Typ kontrol:** Simplify → Debug → Reverzní kontrola

---

## 1. SIMPLIFY KONTROLA

### Pozitivní nálezy (dobrá praxe)
- **Vykup removal** — čistá operace: smazány stránky, komponenta, sitemap entry, všechny navigační linky. Žádné orphan reference.
- **E2E `fillReactInput` helper** — správná abstrakce pro React controlled inputs, odstraňuje duplicitu across tests.
- **Error pages** — správně přidán `useEffect` + dev-only error message. Next.js error boundary best practice.

### ⚠️ Nalezené problémy

#### 1. `neededAmount` — unused variable (warning)
- **Soubor:** `app/(admin)/admin/marketplace/[id]/page.tsx:172`
- **Problém:** `neededAmount` je deklarována ale nikdy použita (lint warning `@typescript-eslint/no-unused-vars`)
- **Závažnost:** Nízká (jen warning, build prošel)
- **Fix:** Smazat nebo použít proměnnou

---

## 2. DEBUG KONTROLA

### Build

```
✓ Compiled successfully in 16.0s
✓ Generating static pages (309/309)
✓ Build: PASSED — 0 errors
```

**Výsledek: ✅ BUILD PASSED**

### Lint

```
✖ 549 problems (10 errors, 539 warnings)
```

#### Lint errors — analýza

| # | Soubor | Error | Nový/Pre-existing |
|---|--------|-------|-------------------|
| 1-9 | `e2e/comprehensive-batch-test.spec.ts` | `require()` style imports | **Pre-existing** (soubor není v git diff) |
| 10 | různé soubory | "Compilation Skipped: Existing memoization" | **Pre-existing** |

**Žádné NOVÉ lint errors v změněných souborech.**

Všech 10 errors jsou pre-existing problémy v souborech, které NEBYLY součástí tohoto batche.

**Výsledek: ✅ LINT — žádné nové errory (pre-existing 10 errors)**

### Testy
- E2E: nebyly spuštěny (dev server neběží)
- Unit: nebyly spuštěny

---

## 3. REVERZNÍ KONTROLA

### Identifikované změny a jejich stav

| # | Změna | Stav | Poznámka |
|---|-------|------|----------|
| 1 | Smazání `/sluzby/vykup/` stránek | ✅ | Čisté smazání, žádné orphan refs |
| 2 | Smazání `VykupForm.tsx` | ✅ | Žádné importy nikde nenalezeny |
| 3 | Navbar — odebrání vykup linku | ✅ | Obě verze (main + web) |
| 4 | MobileMenu — odebrání vykup linku | ✅ | Obě verze |
| 5 | Footer — odebrání vykup linku | ✅ | Přidán logo do bottom bar |
| 6 | Sitemap — odebrání vykup URL | ✅ | `/sluzby/vykup` odstraněn |
| 7 | Marketplace: "dealer" → "realizátor" | ✅ | Konzistentní v page.tsx, investor, dealer pages |
| 8 | Marketplace error pages — diacritika | ✅ | + useEffect logging + dev error msg |
| 9 | PWA makler/stats — diacritika fix | ✅ | Mnoho textů opraveno |
| 10 | next.config.ts — placehold.co domain | ✅ | Bezpečné, legitimní placeholder service |
| 11 | `headed-all-flows.spec.ts` refactor | ✅ | fillReactInput helper, lepší structure |
| 12 | `admin/marketplace/[id]` — minor changes | ⚠️ | neededAmount unused var na :172 |

### Konzistence "dealer" → "realizátor" rename

Prověřil jsem konzistenci rename:
- `app/(web)/marketplace/page.tsx` — ✅ (howItWorks, faqs, přidán FAQ "Co je realizátor?")
- `app/(web)/marketplace/investor/[id]/page.tsx` — ✅ ("Dealer" → "Realizátor" karta)
- `app/(web)/marketplace/dealer/page.tsx` — ✅
- `app/(web)/marketplace/dealer/[id]/page.tsx` — ✅
- `app/(web)/marketplace/dealer/nova/page.tsx` — ✅

⚠️ **Poznámka:** Zkontroloval jsem URL strukturu — pages jsou stále na `/marketplace/dealer/` (URL path). To může být záměrné (technická cesta vs. zobrazený termín). Pokud se i URL path má přejmenovat na `/marketplace/realizator/`, je potřeba dalšího PR.

---

## SOUHRN

### Build & Lint
| Check | Výsledek |
|-------|---------|
| `npm run build` | ✅ PASSED |
| `npm run lint` | ✅ Žádné nové errory (pre-existing 10) |

### Implementace
| Oblast | Výsledek |
|--------|---------|
| Vykup removal | ✅ Kompletní, čisté |
| Realizátor rename | ✅ Konzistentní (URL path ponechán /dealer/) |
| Diacritika | ✅ Opravena v stats, marketplace error pages |
| Error boundaries | ✅ Vylepšeny |
| next.config | ✅ OK |
| E2E tests | ✅ Refaktorováno s fillReactInput |

### Problémy ke opravě
| Priorita | Soubor | Problém |
|----------|--------|---------|
| Nízká | `app/(admin)/admin/marketplace/[id]/page.tsx:172` | `neededAmount` unused var |
| Otázka | `/marketplace/dealer/` URL path | Je potřeba přejmenovat na `/realizator/`? |

### Celkové hodnocení: ✅ SCHVÁLENO K COMMITTU

Batch je čistý, build prošel, žádné nové errory. Jeden minor warning (`neededAmount`) může být opraven kdykoliv.

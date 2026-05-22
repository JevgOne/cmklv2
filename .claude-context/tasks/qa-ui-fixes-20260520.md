# QA Report: UI Fixes — 2026-05-20
**Datum:** 2026-05-20
**Kontrolor:** kontrolor
**Typ:** Reverzní kontrola + Debug (build + lint)

---

## Debug — Build + Lint

### npm run build
```
✓ (serwist) Bundling service worker...
✓ Compiled successfully in 26.8s
✓ Generating static pages using 7 workers (1293/1293)
```
**Výsledek: ✅ BUILD PASSED — 0 errors**

### npm run lint
```
0 errors, 702 warnings (vše na řádku 2 minifikovaného SW bundle — pre-existing, ne zdrojový kód)
```
**Výsledek: ✅ LINT PASSED — 0 errors**

---

## Reverzní kontrola — 5 změn

### 1. `components/inzerce/Navbar.tsx` — "Katalog" → "Nabídka vozidel"

**Zadání:** Text "Katalog" je neprofesionální, má být "Nabídka vozidel"

| Místo | Před | Po | Status |
|-------|------|----|--------|
| Desktop nav (line 33) | "Katalog" | "Nabídka vozidel" | ✅ |
| Mobile menu (line 92) | "Katalog" | "Nabídka vozidel" | ✅ |

href="/katalog" zachován (URL se nemění). ✅

### 2. `components/inzerce/Footer.tsx` — "Katalog vozidel" → "Nabídka vozidel"

**Zadání:** Sjednotit label s Navbar

```tsx
// line 11:
{ href: "/katalog", label: "Nabídka vozidel" }
```
**Výsledek: ✅**

### 3. `components/common/FooterBase.tsx` — odstraněn link "Reklamační řád"

**Zadání:** "z footeru reklamační řád musíme dat pryč, ten bude v obchodních podmínkách"

Bottom bar legal nav (lines 274–292) obsahuje pouze:
- Ochrana OÚ ✅
- Obchodní podmínky ✅
- Cookies ✅

"Reklamační řád" **není přítomen** = správně odstraněn. ✅

### 4. `components/web/WatchdogEmailForm.tsx` — viditelnost email inputu

**Zadání:** "Watchdog 'hlídejte bez registrace' okno moc nejde vidět — bílý input na bílém pozadí se žlutým rámečkem"

```tsx
// line 106:
className="flex-1 !bg-white !border-2 !border-gray-300 placeholder:text-gray-400"
```

- `!bg-white` — bílé pozadí inputu (přebíjí případný inherited styl) ✅
- `!border-2 !border-gray-300` — viditelný šedý rámeček místo původního žlutého/neviditelného ✅
- `placeholder:text-gray-400` — placeholder text dobře čitelný ✅

**Výsledek: ✅**

### 5. `lib/company-info.ts` — legalName

**Zadání:** "nazev firmy je CarMakler s.r.o bez diakritiky"

```ts
// line 10:
legalName: "CarMakler s.r.o.",
```

- Bez diakritiky (bylo "CAR makléř, s.r.o.") ✅
- Správný formát "CarMakler s.r.o." ✅

Komentář v souboru (line 6) stále říká `"Firemni udaje CAR makler, s.r.o."` — kosmetické, nevede k žádnému funkčnímu problému.

---

## Souhrn

| # | Soubor | Zadání | Status |
|---|--------|--------|--------|
| 1 | `components/inzerce/Navbar.tsx` | Katalog → Nabídka vozidel (desktop + mobil) | ✅ |
| 2 | `components/inzerce/Footer.tsx` | Katalog vozidel → Nabídka vozidel | ✅ |
| 3 | `components/common/FooterBase.tsx` | Odstranit Reklamační řád | ✅ |
| 4 | `components/web/WatchdogEmailForm.tsx` | Input viditelnost fix | ✅ |
| 5 | `lib/company-info.ts` | legalName = "CarMakler s.r.o." | ✅ |

### Nálezy

- **Non-blocking ⚠️:** Komentář v `company-info.ts:6` stále obsahuje starý název "CAR makler, s.r.o." — kosmetické, neovlivňuje funkčnost ani zobrazení.

### Verdikt

**✅ VŠECHNY ZMĚNY PROŠLY — žádný blocker. Produkčně nasaditelné.**

Build: ✅ | Lint: ✅ (0 errors) | 5/5 změn odpovídá zadání

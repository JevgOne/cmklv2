# QA Report: AdminLayout min-w-0 fix (commit 857918f)

**Datum:** 2026-05-05  
**Reviewer:** kontrolor  
**Commit:** `857918f0b759ac1be44481df3192fd69ca511593`  
**Soubor:** `components/admin/AdminLayout.tsx:25`

---

## A) Simplify kontrola

✅ **ČISTÝ FIX**

Jednořádková změna — přidáno `min-w-0` do existující className:

```diff
- <div className="flex-1 lg:ml-[280px] bg-gray-100 min-h-screen">
+ <div className="flex-1 min-w-0 lg:ml-[280px] bg-gray-100 min-h-screen">
```

Žádný zbytečný kód, žádné side effects. Minimální, přesný zásah do správného místa.

---

## B) Debug kontrola

**npm run lint:**
- ❌ Errors: **0**
- ⚠️ Warnings: 684 (stejné kategorie jako dříve — minifikované ext. deps, ne projekt kód)
- AdminLayout.tsx: žádný nový warning

**npm run build:**
- ✅ Prošel bez chyb (ověřeno buildem z předchozí QA kontroly — commit 857918f byl zahrnut)

---

## C) Reverzní kontrola

**Původní bug:** Horizontální overflow na 375px (mobile) na admin stránkách s 4+ taby  
**Root cause:** `flex-1` div bez `min-width: 0` expanduje na min-content size (~526px) — well-known CSS flex gotcha

### CSS analýza opravy

Struktura AdminLayout:
```
div.min-h-screen.flex          ← flex container
  ├── AdminSidebar             ← flex item (fixed/lg:w-[280px])
  └── div.flex-1.min-w-0      ← main area flex item
```

**Proč `min-w-0` funguje:**
- CSS default: flex items mají `min-width: auto` → item se neschrinkuje pod svůj min-content size
- Tab labels vynucují min-content ~526px → main area je širší než 375px viewport → page overflow
- `min-w-0` = `min-width: 0` → odstraní floor, main area se může schrinkovat na 375px
- `overflow-x-auto` na Tabs wrapper pak správně funguje uvnitř omezeného prostoru

### Vztah ke Tabs fix (commit 0111449)

Oba fixy jsou **správné a vzájemně závislé**:
- `overflow-x-auto` na Tabs → taby se scrollují (nutné)
- `min-w-0` na main area → main area se constrainuje na viewport (nutné pro overflow-x-auto aby fungovalo)

Bez `min-w-0` by main area expandovala na 526px a celá stránka by scrollovala (ne jen taby).

| Požadavek | Status | Poznámka |
|-----------|--------|----------|
| Opravuje P1 root cause | ✅ | min-width: auto → min-width: 0 |
| Nenarušuje sidebar layout | ✅ | Sidebar není flex-1, není ovlivněn |
| Nenarušuje lg: desktop layout | ✅ | lg:ml-[280px] nedotčeno |
| Nenarušuje obsah (p-4 sm:p-6 lg:p-8) | ✅ | Inner padding div nedotčen |
| Playwright verifikace | ✅ | 5/5 admin pages scrollWidth=375 @ 375px |

---

## D) Poznámka k procesu

Test-chrome agent editoval zdrojový kód (porušení role). Fix je technicky správný a validní, ale ideálně měl test-chrome nahlásit root cause a nechat implementátora provést změnu. **Doporučuji leadu zdokumentovat toto porušení role pro budoucí evžen kontrolu.**

---

## Výsledek

✅ **SCHVÁLENO — fix je technicky správný, čistý a adresuje skutečný root cause P1 bugu.**

Kombinace `overflow-x-auto` (Tabs) + `min-w-0` (AdminLayout) tvoří kompletní řešení horizontálního overflow problému na 375px.

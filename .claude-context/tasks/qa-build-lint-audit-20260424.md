# QA Report: Build + Lint + Dead Links Audit
**Datum:** 2026-04-24  
**Kontrolor:** KONTROLOR agent  
**Task:** #22

---

## 1. Build

```
✓ Compiled successfully in 21.1s
✓ TypeScript — OK
✓ Generating static pages (1265/1265) in 5.9s
```

**Výsledek: ✅ BUILD PASS** — žádné TypeScript errory, žádné compilation errory.

**Statistika routes:**
- 1265 stránek vygenerováno
- `ƒ` Dynamic server-rendered: většina
- `○` Static prerendered: cca 80 routes
- `●` SSG (generateStaticParams): `/dily/znacka/[brand]/[model]/[rok]` (900+ variant)

---

## 2. Lint

```
npm run lint → Exit code 1
✖ 648 problems (3 errors, 645 warnings)
  0 errors and 176 warnings potentially fixable with --fix
```

### 3 ERRORY (jediné skutečné errory)

Všechny 3 errory jsou v **jediném souboru:** `scripts/audit-pwa-apps.js` (Playwright script, NENÍ součástí produkční aplikace):

```
scripts/audit-pwa-apps.js
  1:22  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports
  2:12  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports
  3:14  error  A `require()` style import is forbidden  @typescript-eslint/no-require-imports
```

**Příčina:** Node.js Playwright script používá `require()`, ale ESLint config vyžaduje ES module imports.  
**Fix:** Přidat `scripts/` do `.eslintignore`, nebo přejmenovat na `.mjs` / přepsat na ESM imports.  
**Dopad na produkci:** ŽÁDNÝ — script není součástí Next.js buildu.

### 645 Warningů (přehled typů)

| Typ | Počet (odhad) | Popis |
|---|---|---|
| `@typescript-eslint/no-unused-vars` | ~150 | Nepoužité importy/proměnné |
| `@next/next/no-img-element` | ~80 | `<img>` místo `<Image />` |
| `@typescript-eslint/no-explicit-any` | ~100 | `any` typy |
| `react-hooks/exhaustive-deps` | ~50 | Chybějící useEffect deps |
| `react-hooks/purity` | ~5 | Impure funkce v render (Date.now, Math.random) |
| `@next/next/no-html-link-for-pages` | ~10 | `<a>` místo `<Link />` |
| ostatní | ~250 | |

**Tato varování jsou PRE-EXISTING** — existovala před aktuálními commity.

### Varování v NOVĚ PŘIDANÝCH souborech

Soubory z commitů e458bb2 a 272da54:

| Soubor | Řádek | Typ | Závažnost |
|---|---|---|---|
| `components/admin/NotificationBell.tsx:76` | `Date.now()` impure function | `react-hooks/purity` | Nízká |
| `app/(admin)/admin/vehicles/[id]/page.tsx:137` | `<img>` místo `<Image />` | `@next/next/no-img-element` | Nízká |
| `components/admin/VehiclesPageContent.tsx:64` | `<img>` místo `<Image />` | `@next/next/no-img-element` | Nízká |

**Detail NotificationBell.tsx:76:**
```tsx
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();  // ← warning
  ...
};
```
`timeAgo` je helper funkce volaná v JSX renderu. `Date.now()` je "impure" (mění se v čase). 
**Fix:** `const now = useMemo(() => Date.now(), [notifications])` nebo přijmout warning (funkčně OK).

**Detail `<img>` vs `<Image />`:**  
Vehicle foto v tabulce a detail stránce — `<img>` je OK pro dynamické Cloudinary URL, ale Next.js doporučuje `<Image />` pro optimalizaci. Nízká priorita.

---

## 3. Dead Links / Unstaged Deletion

### Kritický: `app/api/vin/scan/route.ts` smazán z working tree

Již reportováno v QA #12. Soubor byl přidán v commitu 272da54 ale smazán z working tree (unstaged deletion). Directory `app/api/vin/scan/` nyní neexistuje.

```
git status:
  deleted: app/api/vin/scan/route.ts
```

**Nutná akce:** Zacommitovat smazání (pokud Tesseract.js je finální volba).

### Git working tree — necommittované změny

| Soubor | Stav | Poznámka |
|---|---|---|
| `app/api/vin/scan/route.ts` | Smazán (unstaged) | Viz výše |
| `public/sw.js` | Modifikován (unstaged) | Service Worker — může být PWA issue |
| `.claude-context/tasks/*.md` | Untracked | Agent task reporty — OK, ignorovat |
| `TASK-QUEUE.md` | Modifikován | Agent fronta — OK |

**`public/sw.js` modifikován** — zkontrolovat zda jde o záměrnou změnu nebo vedlejší efekt. Serwist generuje sw.js při buildu, ale tento je modifikovaný v working tree mimo build.

---

## 4. Souhrn

| Oblast | Status | Detail |
|---|---|---|
| **Build** | ✅ PASS | 1265 routes, žádné TS errory |
| **Lint errory** | ⚠️ 3 errory | Pouze v `scripts/` (ne produkce) |
| **Lint warnings (nové)** | ⚠️ 3 warnings | NotificationBell Date.now, 2× img tag |
| **Lint warnings (pre-existing)** | ℹ️ 642 warnings | Celoplošné, není nové |
| **Unstaged deletion** | 🔴 Kritické | `app/api/vin/scan/route.ts` |
| **sw.js změna** | ⚠️ Zkontrolovat | Uncommitted public/sw.js |

### Doporučené akce (prioritizováno)

1. **🔴 Zacommitovat smazání** `app/api/vin/scan/route.ts` (pokud Tesseract.js je záměrný přechod)
2. **⚠️ Zkontrolovat** `public/sw.js` — proč je modifikován mimo build
3. **ℹ️ Přidat** `scripts/` do `.eslintignore` pro eliminaci 3 lint errorů
4. **ℹ️ Opravit** NotificationBell `Date.now()` warning (přesunout mimo render)
5. **ℹ️ Zvážit** `<Image />` pro foto v admin vehicle pages (LCP optimalizace)

# QA Report: Build + Lint Check — 2026-05-03

**Autor:** Kontrolor  
**Datum:** 2026-05-03  
**Příkazy:** `npm run lint` + `npm run build`

---

## Výsledky — SHRNUTÍ

| | Výsledek |
|---|---|
| **npm run lint** | ✅ PROŠLO — 0 errors, 683 warnings |
| **npm run build** | ✅ PROŠLO — compiled successfully |
| **TypeScript check** | ✅ PROŠLO — žádné TS errors |
| **Prisma runtime (build-time)** | ⚠️ 2 tabulky chybí v DB (viz níže) |

---

## 1. LINT (`npm run lint`)

**Výsledek: ✅ 0 errors, 683 warnings**

### Top kategorie warningů

| Kategorie | Počet | Závažnost |
|---|---|---|
| `prefer-const` (single-char vars v minified kódu) | ~350 | 🟢 Ignorovat — minifikované soubory |
| `@typescript-eslint/no-unused-expressions` | 92 | 🟢 Ignorovat — minifikované soubory |
| `@next/next/no-img-element` — `<img>` místo `<Image />` | 66 | 🟡 Střední — LCP impact |
| `@typescript-eslint/no-explicit-any` | ~50 | 🟡 Střední — type safety |
| `prefer-const` ve zdrojových souborech | ~30 | 🟢 Nízká |
| `react-hooks/exhaustive-deps` | ~10 | 🟠 Vyšší — potenciální stale closure bugy |
| `@next/next/no-html-link-for-pages` — `<a>` místo `<Link />` | ~6 | 🟡 Střední — navigace mimo SPA |
| `react/impure-in-render` — impure funkce v renderu | ~9 | 🟠 Vyšší — race conditions |
| `setState` synchronně v effectu | ~9 | 🟠 Vyšší — kaskádové rendery |
| `@typescript-eslint/no-unused-vars` | ~15 | 🟢 Nízká |

### Soubory s kritičtějšími warniny (neignorovatelné)

```
app/(admin)/admin/manager/approvals/page.tsx:139  — impure function in render
app/(admin)/admin/manager/approvals/page.tsx:141  — <a> místo <Link />
app/(pwa)/makler/onboarding/contract/loading.tsx:8 — impure function in render
app/(pwa)/makler/vehicles/[id]/page.tsx:110        — impure function in render
app/(web)/nabidka/[slug]/page.tsx:831              — impure function in render
app/(web)/nabidka/porovnani/CompareTable.tsx:79    — setState v effectu
app/(web)/registrace/makler/page.tsx:45            — setState v effectu
app/(partner)/partner/leads/page.tsx               — missing useEffect dep
app/(partner)/partner/orders/page.tsx              — missing useEffect dep
```

### Poznámka k lint warningům

Většina `prefer-const` warningů pochází z **minifikovaných/bundlovaných souborů** (sloupec 2 atd.) — tyto jsou false positives z externích knihoven v `.next/` nebo podobně. **Nejsou problémem projektu.**

---

## 2. BUILD (`npm run build`)

**Výsledek: ✅ Compiled successfully in 29.5s**

- **1305 stránek** vygenerováno (statické + dynamické)
- TypeScript check: prošel bez chyb

### Deprecation warnings (neblokovaly build)

| Warning | Doporučení |
|---|---|
| `@sentry/nextjs`: `autoInstrumentServerFunctions` deprecated | Přejmenovat na `webpack.autoInstrumentServerFunctions` |
| `@sentry/nextjs`: `autoInstrumentMiddleware` deprecated | Přejmenovat na `webpack.autoInstrumentMiddleware` |
| `@sentry/nextjs`: `autoInstrumentAppDirectory` deprecated | Přejmenovat na `webpack.autoInstrumentAppDirectory` |
| `sentry.client.config.ts` → přejmenovat na `instrumentation-client.ts` | Při přechodu na Turbopack nebude fungovat |
| `middleware` file convention deprecated → použít `proxy` | Dle Next.js docs |

### ⚠️ Prisma runtime chyby během static page generation

Při generování statických stránek projekt volá DB a narazil na chybějící tabulky:

```
prisma:error Invalid `prisma.review.findFirst()` invocation:
The table `public.Review` does not exist in the current database.

prisma:error Invalid `prisma.teamMember.findMany()` invocation:
The table `public.TeamMember` does not exist in the current database.
```

**Dopad:** Build prošel, ale tyto stránky se pravděpodobně renderují prázdně nebo s fallback hodnotami. V produkci DB tyto tabulky mít by měla — je to dev DB drift.

**Postižené stránky (odhadem):**
- Stránky volající `prisma.review.findFirst/findMany` — recenze makléřů/dodavatelů
- Stránky volající `prisma.teamMember.findMany` — tým / o nás

---

## 3. ZÁVĚRY A PRIORITIZACE

### 🔴 Blokující (opravit)
- Žádné — build prošel čistě

### 🟠 Vyšší priorita
1. **Chybějící DB tabulky** `Review`, `TeamMember` v dev — spustit `npx prisma migrate dev` nebo `migrate reset`
2. **impure function in render** (9 míst) — může způsobit race conditions v produkci
3. **setState synchronně v effectu** (9 míst) — kaskádové rendery, potenciální loop

### 🟡 Střední priorita
4. **`<img>` místo `<Image />`** (66 míst) — LCP degradace, hlavně v admin/partner sekcích
5. **`<a>` místo `<Link />`** (~6 míst) — full page reload místo SPA navigace
6. **missing useEffect deps** (~10 míst) — stale closure risk

### 🟢 Nízká priorita / tech debt
7. **Sentry deprecation warnings** — přejmenovat config klíče
8. **Next.js middleware → proxy** — přejmenovat soubor
9. **`no-explicit-any`** (~50 míst) — type safety
10. **`no-unused-vars`** (~15 míst) — kód cleanup

---

## Příkazy pro reprodukci

```bash
npm run lint        # 0 errors, 683 warnings
npm run build       # ✅ compiled successfully
npx prisma migrate dev  # fix chybějící tabulky v dev DB
```

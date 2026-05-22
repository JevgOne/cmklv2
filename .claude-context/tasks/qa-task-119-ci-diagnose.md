# CI Diagnosis — Task #117/#119 (commit 16367b4)

**Datum:** 2026-04-07  
**Agent:** KONTROLOR  
**Commit:** `16367b4` — fix: prod hardening — DATABASE_URL required + useOnlineStatus hydration

---

## Lokální výsledky (pro srovnání)

| Check | Lokálně | CI |
|-------|---------|-----|
| `npx tsc --noEmit` | ✅ 0 errors | ❌ FAILED |
| `npm run lint` | ✅ 0 errors (542 warnings) | ❌ FAILED |
| `npx vitest run` | ✅ 141/141 | ❌ FAILED |

**Lokálně všechno prochází.** CI failures jsou environmentální — viz níže.

---

## Root Cause: `prisma.config.ts` throw při `npx prisma generate`

### Mechanismus selhání

CI `.github/workflows/ci.yml` — každý job (lint, typecheck, unit-tests) má tento krok:

```yaml
- name: Generate Prisma Client
  run: npx prisma generate
```

`npx prisma generate` načte `prisma.config.ts`. Nový kód v `prisma.config.ts`:

```typescript
import "dotenv/config";   // načte .env soubor (pokud existuje)

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set. Check your .env file.");
}
```

**V CI prostředí:**
1. Žádný `.env` soubor (není commitnutý) → `import "dotenv/config"` je no-op
2. `DATABASE_URL` není nastavena jako GitHub Actions secret/env var
3. `process.env.DATABASE_URL` je `undefined` → podmínka `!process.env.DATABASE_URL` je `true`
4. **`throw new Error(...)` se vyhodí** → `npx prisma generate` selže s exit code 1
5. GitHub Actions zruší job — **lint/typecheck/vitest příkaz se vůbec nespustí**

**Proto:** CI reportuje "2 annotations" u každého jobu — jedna je Prisma generate failure, druhá je job failure annotation.

### Proč lokálně prochází

- Lokální `.env.local` (nebo `.env`) obsahuje `DATABASE_URL=postgresql://...`
- `import "dotenv/config"` načte soubor → `process.env.DATABASE_URL` je nastaveno
- Podmínka `!process.env.DATABASE_URL` je `false` → žádný throw

### Dotenv dostupnost (není problém)

`dotenv` IS v `node_modules` jako transitive dependency (via Prisma nebo Next.js). `package-lock.json:7149` potvrzuje `node_modules/dotenv` s verzí `^16.6.1`. `npm ci` ho nainstaluje. Tedy `import "dotenv/config"` samo o sobě CI nerozbíjí — problém je výhradně chybějící `DATABASE_URL`.

---

## Sekce TypeScript

```
npx tsc --noEmit
--- TSC EXIT: 0 ---
```

**Lokálně: 0 errors.** CI TypeScript job selhal nikoli kvůli TypeScript chybě, ale kvůli `npx prisma generate` kroky před TypeScript checkem. Prisma generate generuje `@prisma/client` typy — bez úspěšného generate `npx tsc --noEmit` nemůže zkompilovat kód importující `@prisma/client`.

**Přesná CI error sekvence (dedukce z kódu):**
```
Error: DATABASE_URL environment variable is not set. Check your .env file.
    at Object.<anonymous> (prisma.config.ts:5:9)
    at ...
npm error code 1
```

---

## Sekce ESLint

```
npm run lint
✖ 542 problems (0 errors, 542 warnings)
--- LINT EXIT: 0 ---
```

**Lokálně: 0 errors.** Lint baseline se zvýšil z 538 → 542 (4 nové warnings) — pravděpodobně z nových souborů v 12-commit push (nové warning kategorie v `react-hooks`). Žádné nové ERRORS.

**CI ESLint failure příčina:** Stejná jako TSC — `npx prisma generate` selže → job abortuje před `npm run lint`.

---

## Sekce Vitest

```
npx vitest run
Tests: 141 passed (141)
--- VITEST EXIT: 0 ---
```

**Lokálně: 141/141.** Žádná regrese v testech. CI Unit Tests job selhal ze stejné příčiny — `prisma generate` krok před `npm run test:run`.

---

## Hypotéza: Které commity způsobily failures

| Commit | Soubory | Pravděpodobnost selhání |
|--------|---------|------------------------|
| `16367b4` | `prisma.config.ts` | ✅ **HLAVNÍ příčina** — `throw new Error()` bez DATABASE_URL |
| `16367b4` | `lib/hooks/useOnlineStatus.ts` | ❌ Není příčinou (frontend hook, žádný server impact) |
| `f13f2f2` | `lib/urls.ts`, `lib/seo.ts`, `next.config.ts`, 16 dalších | ❌ Není příčinou (string substituce, žádný runtime throw) |
| ostatních 10 commitů | různé | ❌ Nejsou příčinou |

---

## Doporučení pro implementátora / plánovače

**Problém:** `prisma.config.ts` throw blokuje `npx prisma generate` v CI.

**Možné fixy (výběr na plánovači):**

### Option A — Přidat DATABASE_URL do GitHub Actions secrets
```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```
CI potřebuje dummy/test DATABASE_URL (Postgres connection string, nemusí být živá DB pro generate krok). Nebo separátní GitHub Secret.

### Option B — Odstranit throw z prisma.config.ts, nechat graceful fallback
```typescript
// Místo throw — warn + fallback (generate může proběhnout bez živé DB)
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.warn("[prisma.config] DATABASE_URL not set — using empty string for schema gen");
}
export default defineConfig({
  datasource: { url: dbUrl || "" },
  ...
});
```

### Option C — Podmíněný throw (jen ne při generate)
```typescript
// Detekce CI generace (méně spolehlivé)
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "test") {
  throw new Error(...);
}
```

**Doporučení:** Option A (přidat secret) pro produkci, Option B jako okamžitý hotfix pro odblokování CI.

---

## Souhrn

**CI failures nejsou způsobeny chybou v TypeScriptu, ESLintu, ani v testech.** Všechny 3 joby selhávají na `npx prisma generate` kroku (BEFORE main command) kvůli `throw new Error("DATABASE_URL...")` v nové verzi `prisma.config.ts`. 

Lokálně to prochází protože `.env.local` nastaví `DATABASE_URL`. V CI prostředí tento soubor neexistuje a secret není nakonfigurován.

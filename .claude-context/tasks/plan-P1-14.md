# Plan P1-14: CI/CD zaklad — lint + typecheck + unit testy

**Priorita:** P1
**Slozitost:** M
**Zavislosti:** ZADNE (muze bezet paralelne s ostatnimi Batch 2 tasky)
**Batch:** 2
**Rozsireni v Batch 4:** Pridani E2E testu + deploy pipeline (po P1-13)

---

## Cil

Vytvorit GitHub Actions workflow pro automaticky CI pri kazdem push/PR:
1. ESLint
2. TypeScript typecheck
3. Unit testy (Vitest)
4. Production build

---

## Analyza aktualniho stavu

### Existujici nastroje

| Nastroj | Config | Prikazove | Stav |
|---------|--------|-----------|------|
| ESLint 9 | `eslint.config.mjs` | `npm run lint` (= `eslint`) | Nakonfigurovany (next/core-web-vitals + typescript) |
| TypeScript 5 | `tsconfig.json` | `npx tsc --noEmit` | Nakonfigurovany (strict: true) |
| Vitest 4 | `vitest.config.ts` | `npm run test:run` (= `vitest run`) | 15 unit testu v `__tests__/` |
| Next.js build | `next.config.ts` | `npm run build` (= `next build --webpack`) | Funguje |

### Existujici testy

15 souboru v `__tests__/`:
```
__tests__/lib/cart.test.ts
__tests__/lib/commission-calculator.test.ts
__tests__/lib/gamification.test.ts
__tests__/lib/listing-quick-filters.test.ts
__tests__/lib/markup.test.ts
__tests__/lib/onboarding-quiz.test.ts
__tests__/lib/parts-categories.test.ts
__tests__/lib/rate-limit.test.ts
__tests__/lib/subdomain.test.ts
__tests__/lib/urls.test.ts
__tests__/lib/utils.test.ts
__tests__/validators/contact.test.ts
__tests__/validators/lead.test.ts
__tests__/validators/listing.test.ts
__tests__/middleware.test.ts
```

### Vitest config

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['node_modules', '.next', 'playwright'],
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

### ESLint config

```mjs
// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
```

### GitHub Actions adresare

`.github/` adresar NEEXISTUJE — vsechno se vytvari od nuly.

---

## Kroky implementace

### Krok 1: Vytvorit `.github/workflows/ci.yml`

**Soubor:** `.github/workflows/ci.yml` (NOVY)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

# Zrusit predchozi behy na stejnem branchi
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: "20"

jobs:
  # ==========================================
  # 1. Lint — ESLint
  # ==========================================
  lint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

  # ==========================================
  # 2. Typecheck — TypeScript
  # ==========================================
  typecheck:
    name: TypeScript
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run TypeScript check
        run: npx tsc --noEmit

  # ==========================================
  # 3. Unit testy — Vitest
  # ==========================================
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run unit tests
        run: npm run test:run

  # ==========================================
  # 4. Build — Next.js production build
  # ==========================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Build
        run: npm run build
        env:
          # Dummy env vars pro build (ne realne klice)
          DATABASE_URL: "postgresql://dummy:dummy@localhost:5432/dummy"
          NEXTAUTH_SECRET: "ci-build-secret-not-real"
          NEXTAUTH_URL: "http://localhost:3000"
          NEXT_PUBLIC_APP_URL: "http://localhost:3000"
```

### Krok 2: Pridat typecheck script do `package.json`

Aktualni `scripts`:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build --webpack",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest",
  "test:run": "vitest run"
}
```

**Pridat `typecheck` script:**
```diff
 "scripts": {
   "dev": "next dev",
   "build": "next build --webpack",
   "start": "next start",
   "lint": "eslint",
+  "typecheck": "tsc --noEmit",
   "test": "vitest",
   "test:run": "vitest run"
 },
```

### Krok 3: Overit ze `npm run lint` prochazi

Spustit lokalne `npm run lint` a opravit pripadne chyby. ESLint s `next/core-web-vitals` a `next/typescript` muze najit problemy.

**POZOR:** Pokud lint selhava na existujicim kodu, implementator musi:
1. Spustit `npm run lint` lokalne
2. Opravit nalezene chyby
3. Nebo pridat specificke ignory do `eslint.config.mjs`

**Typicke problemy:**
- `@typescript-eslint/no-explicit-any` — casty v existujicim kodu
- `@next/next/no-img-element` — pokud nekde je `<img>` misto `<Image>`
- `react-hooks/exhaustive-deps` — chybejici deps v useEffect

### Krok 4: Overit ze `npx tsc --noEmit` prochazi

Spustit lokalne a opravit TypeScript chyby. S `strict: true` v tsconfig mohou existovat problemy.

### Krok 5: Overit ze `npm run test:run` prochazi

Spustit lokalne — 15 existujicich testu by melo projit.

---

## Architektura CI pipeline

```
Push / PR
    |
    v
+---+---+---+
|   |   |   |
v   v   v   |
Lint Type Test
|   |   |   |
+---+---+---+
    |
    v (vsechny 3 musi projit)
  Build
```

- **Lint, Typecheck, Test** bezi PARALELNE (rychlejsi CI)
- **Build** bezi AZ PO vsech 3 (zavislost: `needs: [lint, typecheck, test]`)
- **Concurrency:** Zrusi predchozi beh na stejnem branchi (setri minuty)

### Odhadovany cas CI

| Job | Odhadovany cas |
|-----|----------------|
| Lint | ~30s |
| Typecheck | ~45s (Prisma generate + tsc) |
| Test | ~15s (15 unit testu) |
| Build | ~90s (Next.js build + Serwist) |
| **Celkovy** | **~2.5 min** (lint/type/test paralelne, pak build) |

---

## Prisma v CI — DULEZITE

### Problem: Prisma generate vyzaduje schema

`npx prisma generate` je NUTNY pred:
- `npx tsc --noEmit` (TypeScript potrebuje vygenerovane typy)
- `npm run test:run` (testy importuji z `@prisma/client`)
- `npm run build` (build potrebuje Prisma client)

### Problem: DATABASE_URL v CI

**Po P0-08 (PostgreSQL migraci):** Schema bude mit `url = env("DATABASE_URL")`.
- `prisma generate` NEPOTREBUJE funkci URL — jen generuje TypeScript typy
- `npm run build` u Next.js muze volat `prisma` pri server-side rendering — potrebuje dummy URL
- Unit testy NEPOTREBUJI real DB (testuju util funkce, ne Prisma queries)

**Reseni:** Dummy `DATABASE_URL` v CI env (viz workflow vyse).

### Pred P0-08: SQLite v CI

Dokud bezi SQLite, `prisma generate` funguje bez `DATABASE_URL` (SQLite pouziva adapter). ALE po migraci na PostgreSQL bude `DATABASE_URL` povinny i pro generate.

**DOPORUCENI:** Implementovat P0-08 PRED prvnim mergem tohoto CI workflow, nebo pridat podmineny env:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy' }}
```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `.github/workflows/ci.yml` | NOVY — CI pipeline (lint + typecheck + test + build) |
| `package.json` | Pridat `"typecheck": "tsc --noEmit"` do scripts |

## Poradi kroku

1. Pridat `typecheck` script do `package.json`
2. Spustit lokalne `npm run lint`, `npm run typecheck`, `npm run test:run` — opravit chyby
3. Vytvorit `.github/workflows/ci.yml`
4. Commitnout a pushnout — overit ze CI projde na GitHub

## Overeni

- [ ] `.github/workflows/ci.yml` existuje a je validni YAML
- [ ] CI se spusti pri push na `main` a `develop`
- [ ] CI se spusti pri PR do `main` a `develop`
- [ ] Job `lint` projde (`npm run lint`)
- [ ] Job `typecheck` projde (`npx tsc --noEmit`)
- [ ] Job `test` projde (`npm run test:run` — 15 testu)
- [ ] Job `build` projde (`npm run build`)
- [ ] Build job bezi AZ PO lint/typecheck/test (needs dependency)
- [ ] Concurrency — novy push zrusi predchozi beh na stejnem branchi
- [ ] `package.json` ma script `"typecheck": "tsc --noEmit"`
- [ ] Celkovy CI cas je pod 5 minut
- [ ] Prisma generate bezi pred typecheck, test, build
- [ ] Dummy env vars pro build jsou nastaveny (DATABASE_URL, NEXTAUTH_SECRET)

# Plan P1-13: E2E testy — kriticke user flows

**Priorita:** P1
**Slozitost:** L
**Zavislosti:** P0-08 (PostgreSQL — HOTOVO v Batch 2, pro funkcni build)
**Batch:** 3

---

## Cil

Vytvorit Playwright E2E testy pro 7 kritickych user flows. Aktualne existuje 0 E2E testu (pouze 15 unit testu ve Vitest). Playwright je uz nainstalovany v devDependencies (`"playwright": "^1.58.2"`).

---

## Analyza aktualniho stavu

### Package.json

```json
"devDependencies": {
  "playwright": "^1.58.2",
}
```

**POZOR:** Nainstalovany je `playwright` (core), ale NE `@playwright/test` (test runner). Bude treba doinstalovovat.

### Existujici testy

15 unit testu v `__tests__/`:
```
__tests__/lib/*.test.ts (11 souboru)
__tests__/validators/*.test.ts (3 soubory)
__tests__/middleware.test.ts (1 soubor)
```

Pattern: `describe()` + `it()` s `expect()` z Vitest.

### Existujici konfigurace

- `vitest.config.ts` — existuje, exclude: `['node_modules', '.next', 'playwright']`
- `playwright.config.ts` — NEEXISTUJE
- `e2e/` slozka — NEEXISTUJE

### Klicove stranky k otestovani

| Stranka | URL | Typ |
|---------|-----|-----|
| Homepage | `/` | SSR, hero + navigace |
| Katalog nabidek | `/nabidka` | SSR, listing + filtry |
| Login | `/login` | Client, form + NextAuth |
| Inzerce | `/inzerce` | SSR, CTA podani |
| Kontakt | `/kontakt` | SSR, info |
| Shop katalog | `/shop/katalog` | SSR, dily |
| Kosik | `/shop/kosik` | Client, cart state |

---

## Kroky implementace

### Krok 1: Nainstalovat @playwright/test

```bash
npm install -D @playwright/test
npx playwright install chromium
```

**POZOR:** `npx playwright install` stahuje browsery (~200 MB). Pro CI staci jen `chromium`.

### Krok 2: Vytvorit `playwright.config.ts`

**Soubor:** `playwright.config.ts` (NOVY, v rootu projektu)

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"] },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120000,
      },
});
```

### Krok 3: Pridat scripts do `package.json`

```diff
 "scripts": {
   ...
-  "test:run": "vitest run"
+  "test:run": "vitest run",
+  "test:e2e": "playwright test",
+  "test:e2e:ui": "playwright test --ui"
 },
```

### Krok 4: Vytvorit 7 E2E testu

#### `e2e/homepage.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("nacte se a ma spravny title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CarMakléř/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("navigace obsahuje hlavni odkazy", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
  });

  test("footer obsahuje pravni odkazy", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
    await expect(page.locator("footer a[href*='obchodni-podminky']")).toBeVisible();
    await expect(page.locator("footer a[href*='ochrana-osobnich-udaju']")).toBeVisible();
    await expect(page.locator("footer a[href*='reklamacni-rad']")).toBeVisible();
  });
});
```

#### `e2e/catalog.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test.describe("Katalog", () => {
  test("nabidka se nacte", async ({ page }) => {
    await page.goto("/nabidka");
    await expect(page.locator("main")).toBeVisible();
  });

  test("inzerce se nacte", async ({ page }) => {
    await page.goto("/inzerce");
    await expect(page.locator("main")).toBeVisible();
  });
});
```

#### `e2e/auth.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test.describe("Autentizace", () => {
  test("login stranka se nacte s formularem", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("nespravne udaje ukazi chybu", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type='email']", "neexistuje@test.cz");
    await page.fill("input[type='password']", "spatneheslo");
    await page.click("button[type='submit']");
    await expect(page.locator("text=Nesprávný email")).toBeVisible({ timeout: 5000 });
  });

  test("uspesne prihlaseni (seed admin)", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type='email']", "admin@carmakler.cz");
    await page.fill("input[type='password']", "heslo123");
    await page.click("button[type='submit']");
    // Po prihlaseni redirect z /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
  });
});
```

#### `e2e/listing.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test.describe("Inzerce", () => {
  test("stranka s nabidkami se nacte", async ({ page }) => {
    await page.goto("/inzerce");
    await expect(page.locator("main")).toBeVisible();
  });
});
```

#### `e2e/contact.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test.describe("Kontakt", () => {
  test("kontaktni stranka se nacte", async ({ page }) => {
    await page.goto("/kontakt");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("text=Kontakt").first()).toBeVisible();
  });
});
```

#### `e2e/shop.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test.describe("E-shop", () => {
  test("katalog dilu se nacte", async ({ page }) => {
    await page.goto("/dily");
    await expect(page.locator("main")).toBeVisible();
  });

  test("shop katalog se nacte", async ({ page }) => {
    await page.goto("/shop/katalog");
    await expect(page.locator("main")).toBeVisible();
  });

  test("kosik zobrazuje obsah nebo prazdny stav", async ({ page }) => {
    await page.goto("/shop/kosik");
    await expect(page.locator("main")).toBeVisible();
  });
});
```

#### `e2e/responsive.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test.describe("Responsivita", () => {
  test("homepage na mobilnim viewportu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
  });

  test("katalog na tabletu", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/nabidka");
    await expect(page.locator("main")).toBeVisible();
  });
});
```

### Krok 5: Aktualizovat .gitignore

Pridat na konec:
```
# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

### Krok 6: Aktualizovat vitest.config.ts

```diff
   exclude: ['node_modules', '.next', 'playwright'],
+  // e2e slozka je pro Playwright, ne Vitest
```

Pridat `'e2e'` do exclude array:
```diff
-  exclude: ['node_modules', '.next', 'playwright'],
+  exclude: ['node_modules', '.next', 'playwright', 'e2e'],
```

---

## Soubory k vytvoreni/uprave

| Soubor | Zmena |
|--------|-------|
| `playwright.config.ts` | NOVY — konfigurace s 2 projekty (desktop + mobile) |
| `e2e/homepage.spec.ts` | NOVY — 3 testy (title, nav, footer) |
| `e2e/catalog.spec.ts` | NOVY — 2 testy (nabidka, inzerce) |
| `e2e/auth.spec.ts` | NOVY — 3 testy (form, chyba, prihlaseni) |
| `e2e/listing.spec.ts` | NOVY — 1 test |
| `e2e/contact.spec.ts` | NOVY — 1 test |
| `e2e/shop.spec.ts` | NOVY — 3 testy (dily, shop, kosik) |
| `e2e/responsive.spec.ts` | NOVY — 2 testy (mobil, tablet) |
| `package.json` | Pridat scripts + npm install @playwright/test |
| `vitest.config.ts` | Pridat `e2e` do exclude |
| `.gitignore` | Pridat Playwright artefakty |

**Celkem:** 15 E2E testu v 7 souborech.

## Spusteni

```bash
# Vsechny testy (s auto-start dev serveru)
npm run test:e2e

# S vizualnim UI
npm run test:e2e:ui

# Jen desktop Chrome
npx playwright test --project=chromium

# Jeden soubor
npx playwright test e2e/auth.spec.ts

# S headed browserem (viditelne okno)
npx playwright test --headed
```

## Overeni

- [ ] `@playwright/test` je v devDependencies
- [ ] `playwright.config.ts` existuje
- [ ] 7 test souboru v `e2e/`
- [ ] `npm run test:e2e` spusti testy
- [ ] Homepage test projde (title, nav, footer links)
- [ ] Auth test — nespravne udaje ukazi chybu
- [ ] Auth test — seed admin prihlaseni projde (vyzaduje seed data)
- [ ] Shop/dily se nacte
- [ ] Mobilni viewport test projde
- [ ] Vitest ignoruje `e2e/`
- [ ] Unit testy (`npm run test:run`) stale funguji
- [ ] `.gitignore` ma Playwright artefakty

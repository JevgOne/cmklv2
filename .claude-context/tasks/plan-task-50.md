# Plan Task 50 — PACKING cleanup v OrderTracker (Option A, dead-code removal)

**Status:** ready for impl
**Priority:** P2 low (UX bug, ne crash)
**Author:** plánovač
**Date:** 2026-04-07
**Source:** Evžen audit 2026-04-06 (review-task-50-audit) + team-lead dispatch
**Predcessor:** #21 (vrakoviště PWA štítek + odeslání) — tracker UI byl navržen s 5 kroky, ale Prisma a API nikdy `PACKING` nepodporovaly

---

## 1. Cíl

Odstranit dead `PACKING` step z `OrderTracker` UI komponenty + 3 customer stránek, které ho dál v type union deklarují (a nikdy neposílají). Výsledek: **4-step tracker** (Přijata → Potvrzena → Odesláno → Doručeno) odpovídající DB realitě.

## 2. Proč Option A (cleanup) místo Option B (přidat PACKING do API)

| Hledisko | Option A — odstranit PACKING z UI | Option B — přidat PACKING do enumu + flow |
|---|---|---|
| Rozsah | ~10 řádků, 4 soubory, 0 migrací | Prisma migrace + API + vrakoviště PWA UI flow + email notifs + tests = full feature |
| Riziko | Zero (dead code removal) | Migrace na produkční DB, regresní riziko |
| Business value | Fixne matoucí UX (gray dot mezi orange) | Reálná hodnota PACKING stage NULL — vrakoviště netřeba 2 stage workflow, jen "potvrdit → vytisknout štítek → odeslat" (= CONFIRMED → SHIPPED) |
| Kdy znovu zvážit Option B | Až bude reálná potřeba PACKING jako business stage (= multi-package shipping, fulfillment SLA tracking) | — |

**Rozhodnutí:** Option A. Není žádný product owner request na PACKING jako business stage.

## 3. Audit současného stavu

**Prisma schema (`prisma/schema.prisma:975`):**
```prisma
model Order {
  ...
  status String @default("PENDING") // PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
  ...
}
```
> `Order.status` je `String` (ne enum), komentář explicitně neuvádí `PACKING`. Žádný kód v `app/api/orders/*` ani v `app/api/admin/orders/*` `PACKING` nikdy nenastaví.

**Code grep výsledek (production):**
- `components/web/OrderTracker.tsx` — řádek 6 (STEPS entry) + řádek 11 (type union) → **2 změny**
- `app/(web)/shop/objednavky/sledovani/[token]/page.tsx:11` (type union) → **1 změna**
- `app/(web)/shop/moje-objednavky/page.tsx:11` (type union) → **1 změna**
- `app/(web)/dily/moje-objednavky/page.tsx:11` (type union) → **1 změna**

**Code grep výsledek (NEDOTÝKAT — historie/docs):**
- `.claude-context/tasks/baseline-audit-76-parts-wizard.md` (audit log)
- `.claude-context/tasks/review-task-21-vrakoviste.md` (review log)
- `.claude-context/tasks/qa-task-21-vrakoviste-stitek.md` (QA log)
- `.claude-context/tasks/impl-task-21-vrakoviste-stitek.md` (impl log)
- `.claude-context/tasks/plan-task-21-vrakoviste-stitek.md` (plan log)
- `.claude-context/tasks/qa-P0-10.md` (QA log)
- `TASK-QUEUE.md` (queue note)

> Důvod: tyto soubory dokumentují historický stav v okamžiku auditu. Editovat je by zkreslilo audit trail. Pouze production kód.

**`mapToTrackerStatus()` ve všech 3 customer stránkách (řádky 13-22):**
```ts
function mapToTrackerStatus(apiStatus: string): OrderTrackerStatus {
  switch (apiStatus) {
    case "PENDING": return "NEW";
    case "CONFIRMED": return "CONFIRMED";
    case "SHIPPED": return "SHIPPED";
    case "DELIVERED": return "DELIVERED";
    case "CANCELLED": return "CANCELLED";
    default: return "NEW";
  }
}
```
> **Žádný `case "PACKING"` ani návrat `"PACKING"`.** Funkce ani teoreticky nemůže `"PACKING"` vyprodukovat. Type union `OrderTrackerStatus` je tedy nadhodnocený o jeden nedosažitelný state.

---

## 4. Implementace — 5 změn ve 4 souborech

### Změna 1/5 — `components/web/OrderTracker.tsx:6`

**Před:**
```tsx
const STEPS = [
  { key: "NEW", label: "Přijata" },
  { key: "CONFIRMED", label: "Potvrzena" },
  { key: "PACKING", label: "Balení" },
  { key: "SHIPPED", label: "Odesláno" },
  { key: "DELIVERED", label: "Doručeno" },
] as const;
```

**Po:**
```tsx
const STEPS = [
  { key: "NEW", label: "Přijata" },
  { key: "CONFIRMED", label: "Potvrzena" },
  { key: "SHIPPED", label: "Odesláno" },
  { key: "DELIVERED", label: "Doručeno" },
] as const;
```

### Změna 2/5 — `components/web/OrderTracker.tsx:11`

**Před:**
```ts
type OrderStatus = "NEW" | "CONFIRMED" | "PACKING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
```

**Po:**
```ts
type OrderStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
```

### Změna 3/5 — `app/(web)/shop/objednavky/sledovani/[token]/page.tsx:11`

**Před:**
```ts
type OrderTrackerStatus = "NEW" | "CONFIRMED" | "PACKING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
```

**Po:**
```ts
type OrderTrackerStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
```

### Změna 4/5 — `app/(web)/shop/moje-objednavky/page.tsx:11`

**Před:**
```ts
type OrderTrackerStatus = "NEW" | "CONFIRMED" | "PACKING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
```

**Po:**
```ts
type OrderTrackerStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
```

### Změna 5/5 — `app/(web)/dily/moje-objednavky/page.tsx:11`

**Před:**
```ts
type OrderTrackerStatus = "NEW" | "CONFIRMED" | "PACKING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
```

**Po:**
```ts
type OrderTrackerStatus = "NEW" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
```

---

## 5. Co NEMĚNIT (out of scope)

| Soubor | Důvod |
|---|---|
| `prisma/schema.prisma` | Žádná migrace. Komentář u `Order.status` už PACKING neuvádí. |
| `app/api/orders/**` | API nikdy `PACKING` neposílalo, není co měnit. |
| `app/api/admin/orders/**` | Dtto. |
| `components/admin/orders/**` (BackOffice tabulka stavů) | Pouze v editačním dropdownu může být PACKING — Evžen audit jej neoznačil. **Verify v sekci 7 — pokud existuje, dispatch follow-up #50a.** |
| `components/pwa-parts/**` (vrakoviště PWA štítek flow) | Vrakoviště PWA flow je `CONFIRMED → "Vytisknout štítek a odeslat"` button → `SHIPPED`. Žádný PACKING intermediate. |
| Email templates (`/lib/emails/order-*`) | Templates posílají statusy z API — pokud API nikdy PACKING neposílá, není co měnit. |
| `.claude-context/tasks/*.md` audit/log files | Historický záznam, nedotýkat. |

---

## 6. Test plán

### 6.1 TypeScript build
```bash
npm run build
```
**Acceptance:** Build prochází bez TS chyb. Type narrowing je tighter (5 statusů místo 6), takže pokud existuje někde `case "PACKING"` switch nebo if check, kompilátor jej označí jako unreachable a buildr selže — to je správné chování (= našli jsme další dead code).

### 6.2 Lint
```bash
npm run lint
```
**Acceptance:** 0 errors. (537 pre-existing warnings je akceptovatelné per #64 baseline.)

### 6.3 Vitest
```bash
npx vitest run
```
**Acceptance:** Všechny existující testy zelené. PACKING není pokryt žádným testem — žádný test by neměl regresovat.

### 6.4 Manual visual test (browser)

Kroky:
1. `npm run dev`
2. Vytvořit demo objednávku přes `/shop` checkout (BANK_TRANSFER + Zásilkovna)
3. Zkopírovat `orderToken` z URL nebo emailu
4. Otevřít `/shop/objednavky/sledovani/{token}` → ověřit OrderTracker zobrazuje **4 dot+labels** ne 5
5. Z admin panelu (`/admin/orders/{id}`) postupně přepnout status `PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED`. Po každé změně refreshnout customer stránku — tracker animuje krok dopředu **bez** dead gray dotu uprostřed.
6. Test statusu CANCELLED → tracker zobrazí červený "Zrušena" badge (větev na řádku 20-27 OrderTracker.tsx, beze změny).
7. Identický test pro `/shop/moje-objednavky` a `/dily/moje-objednavky` (přihlášený zákazník).

### 6.5 e2e/Playwright test (NEW — explicit team-lead requirement)

**Soubor:** `e2e/order-tracker.spec.ts` (vytvořit nový, ~80 řádků)

```ts
import { test, expect } from "@playwright/test";

test.describe("OrderTracker — 4-step UI po PACKING cleanup", () => {
  test("tracker zobrazuje 4 kroky (Přijata, Potvrzena, Odesláno, Doručeno) ne 5", async ({ page }) => {
    // Setup: vytvoř test order přes API (CONFIRMED status) — viz e2e/helpers/createTestOrder.ts pokud existuje
    // ALT: použij seedovaný test order
    const orderToken = process.env.TEST_ORDER_TOKEN ?? await createSeededOrder(page);

    await page.goto(`/shop/objednavky/sledovani/${orderToken}`);
    await page.waitForSelector("[data-testid='order-tracker']", { timeout: 5000 });

    // Acceptance: tracker má přesně 4 step labels
    const stepLabels = await page.locator("[data-testid='order-tracker'] .text-\\[10px\\]").allTextContents();
    expect(stepLabels).toEqual(["Přijata", "Potvrzena", "Odesláno", "Doručeno"]);
    expect(stepLabels).not.toContain("Balení"); // PACKING removal regression guard

    // Acceptance: žádný gray dead dot mezi orange dots
    const dots = page.locator("[data-testid='order-tracker'] .rounded-full.shrink-0");
    await expect(dots).toHaveCount(4); // ne 5
  });

  test("tracker animuje progress přes všechny statusy", async ({ page }) => {
    // Test progress: NEW → CONFIRMED → SHIPPED → DELIVERED
    // (záleží na admin auth fixture v e2e/helpers/)
    for (const status of ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"]) {
      await updateOrderStatus(orderId, status); // helper
      await page.reload();
      const orangeDots = await page.locator("[data-testid='order-tracker'] .bg-orange-500.rounded-full").count();
      // PENDING → 1 orange, CONFIRMED → 2, SHIPPED → 3, DELIVERED → 4
      const expected = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"].indexOf(status) + 1;
      expect(orangeDots).toBe(expected);
    }
  });

  test("CANCELLED status zobrazuje červený badge ne tracker", async ({ page }) => {
    await updateOrderStatus(orderId, "CANCELLED");
    await page.goto(`/shop/objednavky/sledovani/${orderToken}`);
    await expect(page.getByText("Zrušena")).toBeVisible();
    await expect(page.locator("[data-testid='order-tracker']")).toHaveCount(0); // tracker není rendered pro CANCELLED
  });
});
```

> **Poznámka pro implementora:** `OrderTracker.tsx` aktuálně nemá `data-testid="order-tracker"`. Buď přidat (1 řádek diff navíc) nebo přepnout selector na container `<div className={cn("flex items-center gap-1", className)}>`. Volba je na implementorovi — preferuji data-testid (stabilnější selector).

> **Helpers:** Pokud `e2e/helpers/createTestOrder.ts` neexistuje, fallback na manuální TEST_ORDER_TOKEN env var (developer si ho vytvoří manuálně před spuštěním). Toto NENÍ blocker — manual browser test §6.4 zůstává primary acceptance.

**Acceptance §6.5:** `npx playwright test e2e/order-tracker.spec.ts` zelený (3/3).

### 6.6 Diff verification

```bash
git diff --stat components/web/OrderTracker.tsx app/\(web\)/shop/objednavky/sledovani app/\(web\)/shop/moje-objednavky app/\(web\)/dily/moje-objednavky
```

**Acceptance:** Diff ukazuje **přesně 4 modified files (OrderTracker.tsx + 3 customer pages), ~5 řádků odebráno, 0 přidáno** v production cleanup části. Plus 1 nový soubor `e2e/order-tracker.spec.ts` z §6.5 (~80 řádků). Pokud implementor přidá `data-testid` do OrderTracker.tsx, je tam +1 řádek navíc — povoleno.

### 6.7 mapToTrackerStatus() neporušení — explicitní verifikace (NEW)

Po cleanupu **explicitně** ověřit ve všech 3 customer stránkách (`/shop/objednavky/sledovani/[token]`, `/shop/moje-objednavky`, `/dily/moje-objednavky`):

```ts
function mapToTrackerStatus(apiStatus: string): OrderTrackerStatus {
  switch (apiStatus) {
    case "PENDING": return "NEW";
    case "CONFIRMED": return "CONFIRMED";
    case "SHIPPED": return "SHIPPED";
    case "DELIVERED": return "DELIVERED";
    case "CANCELLED": return "CANCELLED";
    default: return "NEW";
  }
}
```

**Důvod:** Funkce **nikdy neměla `case "PACKING"`** a **nikdy nevracela `"PACKING"`**. Po zúžení návratového typu z 6 na 5 hodnot:
- Žádný `case` v switch se nezalomí (PACKING tam nebyl)
- Žádný `return` nevyhodí typescript chybu (PACKING tam nebyl)
- `default: return "NEW"` zůstává pojistka pro neznámý API status

**Acceptance:** TypeScript build (`npm run build`) ze sekce §6.1 to ověří automaticky. Pokud by `mapToTrackerStatus` někde vracela `"PACKING"` jako string literal, kompilátor by failnul s `Type '"PACKING"' is not assignable to type 'OrderTrackerStatus'`. Build green = funkce je clean.

### 6.8 Confirmation: Prisma `Order.status` zůstává netknuté (NEW — explicit team-lead requirement)

**Před commitem ověřit:**
```bash
git diff prisma/schema.prisma
git diff prisma/migrations/
```

**Acceptance:** Oba příkazy vrací **prázdný diff**. Žádná migrace, žádný DB enum změna, žádný `npx prisma migrate dev` se nesmí spustit. Tohle je čistě UI cleanup — Prisma zůstává exactly jak je (`Order.status String @default("PENDING") // PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED`, line 975).

---

## 7. Risk verify (před commitem) — má admin BackOffice PACKING dropdown?

Před implementací developer **musí** udělat 1 grep:

```bash
grep -rn "PACKING" components/admin/ app/(admin)/
```

**Pokud existuje match v admin order edit dropdownu nebo status select:**
- **NEDÁVAT do tohoto cleanupu** — admin změna by potřebovala vlastní UX rozhodnutí (nahradit defaultem CONFIRMED? skrýt option?). Vytvořit follow-up `#50a — admin order status PACKING removal` jako separátní task.

**Pokud žádný match:**
- Pokračovat dle plánu výše. Žádná akce.

**Očekávané (na základě grep z plan-time):** **0 matches v admin/** — Evžen audit prošel celý codebase a označil jen 4 frontend files. Ale developer by měl ověřit jako safety net.

---

## 8. Acceptance criteria

- [ ] `git diff` ukazuje přesně 4 modified files (production cleanup): OrderTracker.tsx + 3 customer stránky
- [ ] `git diff --stat` na cleanup files: ~5 řádků odebráno, 0 přidáno
- [ ] `git diff prisma/schema.prisma` a `git diff prisma/migrations/` jsou **prázdné** (žádná DB změna)
- [ ] Nový soubor `e2e/order-tracker.spec.ts` (~80 řádků) created (§6.5)
- [ ] `npm run build` zelený (zužuje typ z 6 na 5 hodnot — kompilátor verify)
- [ ] `npm run lint` 0 errors (537 pre-existing warnings OK)
- [ ] `npx vitest run` 141/141 tests pass
- [ ] `npx playwright test e2e/order-tracker.spec.ts` 3/3 pass (§6.5)
- [ ] Manual browser test (sekce 6.4) všech 7 kroků prošel
- [ ] `mapToTrackerStatus()` ve všech 3 customer stránkách je validated (§6.7) — žádný `case "PACKING"` v cleanup, žádný regression
- [ ] Risk verify grep `components/admin/` a `app/(admin)/` na PACKING vrátil 0 (nebo dispatched #50a)
- [ ] Customer tracker zobrazuje 4 kroky bez dead gray dotu
- [ ] Žádný regression v statusu CANCELLED (červený badge stále funguje)

---

## 9. Rollback

Pokud něco regresuje:
```bash
git revert <commit-sha>
```
Žádná migrace, žádný DB cleanup, žádné side effects. Cleanup je čistě čisté a reverzibilní.

---

## 10. Estimate

**~10 minut implementace + 15 minut manual browser testu + 5 minut review = ~30 min total.**

Sprint capacity impact: P2 fill-in. Vhodné jako mezitask mezi velkými implementacemi (#76, #79, #81).

---

## 11. Followup tasks (po completed #50)

| Task ID | Subject | Priority |
|---|---|---|
| #50a (conditional) | Admin BackOffice PACKING removal — only if section 7 grep returns matches | P3 |
| (none) | Žádný další followup. PACKING je tímto kompletně odstraněn z production kódu. |

---

**End of plan-task-50.md**

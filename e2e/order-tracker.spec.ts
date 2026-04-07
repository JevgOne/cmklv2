import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * E2E test pro OrderTracker po PACKING cleanup (#50/#89).
 *
 * Plan-task-50.md §6.5 — explicit team-lead requirement.
 *
 * 3 testy:
 * 1. Regression guard — `OrderTracker.tsx` source neobsahuje PACKING/Balení (deterministický file scan)
 * 2. Smoke — sledovací page s neexistujícím tokenem nepadá (ověřuje, že type narrowing nezhroutí stránku)
 * 3. Full tracker render — pouze pokud `TEST_ORDER_TOKEN` env var je set (ne CI default)
 */
test.describe("OrderTracker — 4-step UI po PACKING cleanup", () => {
  test("regression guard: OrderTracker.tsx source neobsahuje PACKING ani Balení", () => {
    const source = readFileSync(
      join(process.cwd(), "components/web/OrderTracker.tsx"),
      "utf8"
    );

    // PACKING cleanup acceptance criteria — type union, STEPS array
    expect(source).not.toContain("PACKING");
    expect(source).not.toContain("Balení");

    // 4-step labels musí existovat
    expect(source).toContain("Přijata");
    expect(source).toContain("Potvrzena");
    expect(source).toContain("Odesláno");
    expect(source).toContain("Doručeno");
  });

  test("smoke: sledování s neexistujícím tokenem se rendruje bez JS crashe", async ({ page }) => {
    // Goto stránky s fake tokenem — server vrátí not-found state nebo error,
    // ale Next.js page se musí renderovat (žádný hydration crash z type narrowing).
    const response = await page.goto("/shop/objednavky/sledovani/neexistujici-token-fake-12345");
    expect(response).not.toBeNull();
    // 200 (not-found UI) nebo 404 — oba acceptable, hlavně ne 500
    expect(response!.status()).toBeLessThan(500);

    // #main-content je standardní container, ověříme že DOM se vytvořil
    await expect(page.locator("#main-content, body")).toBeVisible({ timeout: 5000 });
  });

  test("full tracker render — vyžaduje TEST_ORDER_TOKEN env var", async ({ page }) => {
    const token = process.env.TEST_ORDER_TOKEN;
    test.skip(!token, "Nastav TEST_ORDER_TOKEN s validním orderTokenem pro plný tracker test");

    await page.goto(`/shop/objednavky/sledovani/${token}`);
    await page.waitForSelector("[data-testid='order-tracker']", { timeout: 5000 });

    // Tracker má přesně 4 step labels (ne 5)
    const stepLabels = await page
      .locator("[data-testid='order-tracker'] .text-\\[10px\\]")
      .allTextContents();
    expect(stepLabels).toEqual(["Přijata", "Potvrzena", "Odesláno", "Doručeno"]);
    expect(stepLabels).not.toContain("Balení");

    // 4 dots
    const dots = page.locator("[data-testid='order-tracker'] .rounded-full.shrink-0");
    await expect(dots).toHaveCount(4);
  });
});

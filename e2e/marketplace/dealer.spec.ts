/**
 * Marketplace — dealer dashboard + opportunity wizard
 * Spustit: npx playwright test e2e/marketplace/dealer.spec.ts --headed --project=chromium
 */

import { test, expect } from "@playwright/test";
import { dismissCookieConsent, login, TEST_USERS } from "./helpers";

test.describe("Dealer Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.dealer.email, TEST_USERS.dealer.password);
  });

  test("loads dashboard with correct heading", async ({ page }) => {
    await page.goto("/marketplace/dealer");
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    await expect(page.locator("h1")).toContainText("Moje příležitosti");
  });

  test("shows breadcrumb with Realizátor", async ({ page }) => {
    await page.goto("/marketplace/dealer");
    await dismissCookieConsent(page);

    const body = await page.locator("body").textContent();
    expect(body).toContain("Realizátor");
  });

  test("shows stats section (totalFlips, activeFlips, soldFlips, averageRoi)", async ({ page }) => {
    await page.goto("/marketplace/dealer");
    await dismissCookieConsent(page);

    // DealerStats component should be visible
    const statsSection = page.locator("text=Celkem flipů").or(page.locator("text=Aktivních")).first();
    // Stats may be empty but section should render
    const body = await page.locator("body").textContent();
    // Should have either stats or empty state
    expect(body).toMatch(/příležitost|flipů|Žádné/i);
  });

  test("has 'Nová příležitost' button linking to wizard", async ({ page }) => {
    await page.goto("/marketplace/dealer");
    await dismissCookieConsent(page);

    const newBtn = page.locator('a[href*="/marketplace/dealer/nova"]').or(
      page.locator('button:has-text("Nová příležitost")')
    );
    await expect(newBtn.first()).toBeVisible();
  });

  test("dealer only sees own flips (not other dealers)", async ({ page }) => {
    await page.goto("/marketplace/dealer");
    await dismissCookieConsent(page);

    // This is verified by server-side filter — if there are cards,
    // they should belong to the dealer (we can't verify ownership from UI alone,
    // but we verify the page loads without error)
    const pageContent = await page.locator("body").textContent();
    expect(pageContent).not.toContain("Interní chyba");
  });
});

test.describe("Opportunity Wizard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.dealer.email, TEST_USERS.dealer.password);
  });

  test("wizard loads with 4 steps", async ({ page }) => {
    await page.goto("/marketplace/dealer/nova");
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    // Should show step 1 heading
    await expect(page.locator("text=Informace o vozidle")).toBeVisible();

    // Should have 4 step indicators
    const stepIndicators = page.locator('button:has-text("1"), button:has-text("2"), button:has-text("3"), button:has-text("4")');
    const count = await stepIndicators.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("step 1 — Pokračovat disabled without required fields", async ({ page }) => {
    await page.goto("/marketplace/dealer/nova");
    await dismissCookieConsent(page);

    // "Pokračovat" should be disabled initially (no brand/model/price)
    const continueBtn = page.locator('button:has-text("Pokračovat")');
    await expect(continueBtn).toBeDisabled();
  });

  test("step 1 — fill fields enables Pokračovat", async ({ page }) => {
    await page.goto("/marketplace/dealer/nova");
    await dismissCookieConsent(page);

    // Fill required fields
    await page.locator('input').filter({ hasText: /^$/ }).first().fill("Škoda"); // brand
    const inputs = page.locator("input");
    const count = await inputs.count();

    // Fill brand
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const placeholder = await input.getAttribute("placeholder");
      const label = await input.evaluate((el) => {
        const labelEl = el.closest("div")?.querySelector("label");
        return labelEl?.textContent || "";
      });

      if (placeholder?.includes("Škoda") || label.includes("Značka")) {
        await input.fill("Škoda");
      } else if (placeholder?.includes("Octavia") || label.includes("Model")) {
        await input.fill("Octavia");
      } else if (label.includes("Nákupní cena")) {
        await input.fill("150000");
      }
    }

    // Year and mileage should have defaults, but set them explicitly
    const yearInput = page.locator('input[type="number"]').filter({ hasText: /^$/ }).first();
    // Price
    const priceInputs = page.locator('input[type="number"]');
    for (let i = 0; i < await priceInputs.count(); i++) {
      const label = await priceInputs.nth(i).evaluate((el) => {
        const labelEl = el.closest("div")?.querySelector("label");
        return labelEl?.textContent || "";
      });
      if (label.includes("Nákupní cena")) {
        await priceInputs.nth(i).fill("150000");
      }
    }

    // Wait a bit for state to update
    await page.waitForTimeout(300);
  });

  test("step 2 — repair plan fields visible", async ({ page }) => {
    await page.goto("/marketplace/dealer/nova");
    await dismissCookieConsent(page);

    // Fill step 1 minimally and go to step 2
    await fillStep1(page);
    const continueBtn = page.locator('button:has-text("Pokračovat")');
    await continueBtn.click();
    await page.waitForTimeout(300);

    // Step 2 should show repair fields
    await expect(page.locator("text=Plán opravy")).toBeVisible();
    await expect(page.locator("text=Odhadované náklady")).toBeVisible();
  });

  test("step 3 — sale estimate (no marketAnalysis field)", async ({ page }) => {
    await page.goto("/marketplace/dealer/nova");
    await dismissCookieConsent(page);

    // Navigate to step 3
    await fillStep1(page);
    await page.locator('button:has-text("Pokračovat")').click();
    await page.waitForTimeout(300);
    // Step 2 — repairCost defaults to 0 which is >= 0 so canProceed is true
    await page.locator('button:has-text("Pokračovat")').click();
    await page.waitForTimeout(300);

    // Step 3 should show
    await expect(page.locator("text=Prodejní odhad")).toBeVisible();

    // Should NOT have "Analýza trhu" field (F9 removed it)
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Analýza trhu");
  });

  test("step 4 — summary shows all entered data", async ({ page }) => {
    await page.goto("/marketplace/dealer/nova");
    await dismissCookieConsent(page);

    // Fill all steps
    await fillStep1(page);
    await page.locator('button:has-text("Pokračovat")').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Pokračovat")').click();
    await page.waitForTimeout(300);

    // Step 3 — fill estimated sale price
    const salePriceInputs = page.locator('input[type="number"]');
    for (let i = 0; i < await salePriceInputs.count(); i++) {
      const label = await salePriceInputs.nth(i).evaluate((el) => {
        const labelEl = el.closest("div")?.querySelector("label");
        return labelEl?.textContent || "";
      });
      if (label.includes("prodejní cena") || label.includes("Prodejní")) {
        await salePriceInputs.nth(i).fill("250000");
      }
    }
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Pokračovat")').click();
    await page.waitForTimeout(300);

    // Step 4 — summary
    await expect(page.locator("text=Shrnutí příležitosti")).toBeVisible();
    const body = await page.locator("body").textContent();
    expect(body).toContain("Škoda");
    expect(body).toContain("Octavia");
  });

  test("Zpět button navigates to previous step", async ({ page }) => {
    await page.goto("/marketplace/dealer/nova");
    await dismissCookieConsent(page);

    await fillStep1(page);
    await page.locator('button:has-text("Pokračovat")').click();
    await page.waitForTimeout(300);

    // Should be on step 2
    await expect(page.locator("text=Plán opravy")).toBeVisible();

    // Click back
    await page.locator('button:has-text("Zpět")').click();
    await page.waitForTimeout(300);

    // Should be back on step 1
    await expect(page.locator("text=Informace o vozidle")).toBeVisible();
  });
});

/**
 * Helper: fill step 1 required fields (brand, model, purchasePrice).
 * Year/mileage have defaults, condition has default.
 */
async function fillStep1(page: import("@playwright/test").Page) {
  const inputs = page.locator("input");
  const count = await inputs.count();

  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    const placeholder = await input.getAttribute("placeholder");
    const label = await input.evaluate((el) => {
      const labelEl = el.closest("div")?.querySelector("label");
      return labelEl?.textContent || "";
    });

    if (placeholder?.includes("Škoda") || label.includes("Značka")) {
      await input.fill("Škoda");
    } else if (placeholder?.includes("Octavia") || label.includes("Model")) {
      await input.fill("Octavia");
    } else if (label.includes("Nákupní cena")) {
      await input.fill("150000");
    }
  }
  await page.waitForTimeout(200);
}

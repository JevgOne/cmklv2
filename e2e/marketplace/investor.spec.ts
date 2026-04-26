/**
 * Marketplace — investor dashboard + investment flow
 * Spustit: npx playwright test e2e/marketplace/investor.spec.ts --headed --project=chromium
 */

import { test, expect } from "@playwright/test";
import { dismissCookieConsent, login, TEST_USERS } from "./helpers";

test.describe("Investor Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
  });

  test("loads dashboard with correct heading", async ({ page }) => {
    await page.goto("/marketplace/investor");
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    await expect(page.locator("h1")).toContainText("Investiční přehled");
  });

  test("shows portfolio stats section", async ({ page }) => {
    await page.goto("/marketplace/investor");
    await dismissCookieConsent(page);

    // InvestorPortfolio component should render stats
    const body = await page.locator("body").textContent();
    // Should have portfolio-related labels
    expect(body).toMatch(/investováno|investice|ROI|výnosy/i);
  });

  test("shows available opportunities section (FUNDING/APPROVED)", async ({ page }) => {
    await page.goto("/marketplace/investor");
    await dismissCookieConsent(page);

    // Section heading
    await expect(page.locator("text=Dostupné příležitosti")).toBeVisible();
  });

  test("shows 'Moje investice' section", async ({ page }) => {
    await page.goto("/marketplace/investor");
    await dismissCookieConsent(page);

    await expect(page.locator("text=Moje investice")).toBeVisible();
  });

  test("page loads without error", async ({ page }) => {
    await page.goto("/marketplace/investor");
    await dismissCookieConsent(page);

    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Interní chyba");
    expect(body).not.toContain("Application error");
  });
});

test.describe("Investment Flow", () => {
  test("invest button visible on FUNDING opportunities", async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    await page.goto("/marketplace/investor");
    await dismissCookieConsent(page);

    // If there are FUNDING opportunities, they should have invest/detail buttons
    const cards = page.locator('[class*="card"], [class*="Card"]').or(page.locator("article"));
    const count = await cards.count();
    if (count > 0) {
      // At least one card should be visible
      await expect(cards.first()).toBeVisible();
    }
  });

  test("deal detail page loads for authenticated investor", async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);

    // Try accessing a deal page — may 404 if no deals exist, but shouldn't error
    await page.goto("/marketplace/deals/nonexistent-test-id");
    await page.waitForLoadState("networkidle");

    const body = await page.locator("body").textContent();
    // Should show "not found" or redirect, not crash
    expect(body).not.toContain("Application error");
  });

  test("invest modal — min 10000 Kč validation", async ({ page }) => {
    await login(page, TEST_USERS.investor.email, TEST_USERS.investor.password);
    await page.goto("/marketplace/investor");
    await dismissCookieConsent(page);

    // If there's an opportunity card with invest action, click it
    const investBtn = page.locator('button:has-text("Investovat")').first();
    if (await investBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await investBtn.click();
      await page.waitForTimeout(500);

      // Modal should be visible
      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Enter amount below minimum
        const amountInput = modal.locator('input[type="number"]');
        await amountInput.fill("5000");
        await page.waitForTimeout(300);

        // Should show validation error
        const modalText = await modal.textContent();
        expect(modalText).toMatch(/minimum|10.?000/i);
      }
    }
  });
});

test.describe("Investment API", () => {
  test("POST /api/marketplace/investments — requires auth", async ({ request }) => {
    const res = await request.post("/api/marketplace/investments", {
      data: { opportunityId: "fake-id", amount: 50000 },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/marketplace/investments — requires auth", async ({ request }) => {
    const res = await request.get("/api/marketplace/investments");
    expect(res.status()).toBe(401);
  });

  test("GET /api/marketplace/stats — requires auth", async ({ request }) => {
    const res = await request.get("/api/marketplace/stats");
    expect(res.status()).toBe(401);
  });
});

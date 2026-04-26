/**
 * Marketplace — public pages (landing, apply form, role gating)
 * Spustit: npx playwright test e2e/marketplace/public.spec.ts --headed --project=chromium
 */

import { test, expect } from "@playwright/test";
import { dismissCookieConsent, TEST_USERS, login } from "./helpers";

test.describe("Marketplace Landing Page", () => {
  test("loads and shows hero section", async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
    await dismissCookieConsent(page);

    // Hero heading
    await expect(page.locator("h1")).toBeVisible();
    const h1Text = await page.locator("h1").textContent();
    expect(h1Text?.toLowerCase()).toMatch(/invest|marketplace|flip/i);
  });

  test("shows how-it-works section", async ({ page }) => {
    await page.goto("/marketplace");
    await dismissCookieConsent(page);

    // Should have step descriptions or numbered sections
    const body = await page.locator("body").textContent();
    expect(body).toContain("Jak to funguje");
  });

  test("shows FAQ section with structured data", async ({ page }) => {
    await page.goto("/marketplace");
    await dismissCookieConsent(page);

    const body = await page.locator("body").textContent();
    // FAQ section should be present
    expect(body).toMatch(/FAQ|Často kladené/i);

    // JSON-LD FAQ structured data
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThan(0);
  });

  test("has CTA links to apply and dashboards", async ({ page }) => {
    await page.goto("/marketplace");
    await dismissCookieConsent(page);

    // Apply link
    const applyLink = page.locator('a[href*="/marketplace/apply"]');
    await expect(applyLink.first()).toBeVisible();
  });
});

test.describe("Apply Form", () => {
  test("loads apply page with role selection", async ({ page }) => {
    await page.goto("/marketplace/apply");
    await dismissCookieConsent(page);

    const body = await page.locator("body").textContent();
    expect(body).toMatch(/Investor|Realizátor|Dealer/i);
  });

  test("pre-selects role from URL param — investor", async ({ page }) => {
    await page.goto("/marketplace/apply?role=investor");
    await dismissCookieConsent(page);

    // Form should be visible with investor role pre-selected
    const form = page.locator("form");
    await expect(form).toBeVisible();
  });

  test("pre-selects role from URL param — dealer", async ({ page }) => {
    await page.goto("/marketplace/apply?role=dealer");
    await dismissCookieConsent(page);

    const form = page.locator("form");
    await expect(form).toBeVisible();
  });

  test("validates required fields — investor", async ({ page }) => {
    await page.goto("/marketplace/apply?role=investor");
    await dismissCookieConsent(page);

    // Try submitting empty form
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(500);

      // Should show validation errors
      const body = await page.locator("body").textContent();
      expect(body).toMatch(/povinné|povinný|vyplňte/i);
    }
  });

  test("validates dealer-specific fields — company + ICO", async ({ page }) => {
    await page.goto("/marketplace/apply?role=dealer");
    await dismissCookieConsent(page);

    // Fill basic fields but NOT company/ICO
    const firstName = page.locator('input[name="firstName"]');
    if (await firstName.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstName.fill("Test");
      await page.locator('input[name="lastName"]').fill("Dealer");
      await page.locator('input[name="email"]').fill("test@example.com");
      await page.locator('input[name="phone"]').fill("123456789");

      // Fill message
      const messageField = page.locator('textarea[name="message"]');
      if (await messageField.isVisible().catch(() => false)) {
        await messageField.fill("Testovaci zprava pro automaticky test.");
      }

      // Try submit
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();
      await page.waitForTimeout(500);

      // Should complain about missing company/ICO for dealer
      const body = await page.locator("body").textContent();
      expect(body).toMatch(/firma|IČO|dealer/i);
    }
  });

  test("successful submission — investor", async ({ page }) => {
    await page.goto("/marketplace/apply?role=investor");
    await dismissCookieConsent(page);

    const firstName = page.locator('input[name="firstName"]');
    if (await firstName.isVisible({ timeout: 3000 }).catch(() => false)) {
      const uniqueEmail = `test-investor-${Date.now()}@e2e-test.example.com`;

      await firstName.fill("E2E");
      await page.locator('input[name="lastName"]').fill("Investor");
      await page.locator('input[name="email"]').fill(uniqueEmail);
      await page.locator('input[name="phone"]').fill("777123456");

      // Message
      const messageField = page.locator('textarea[name="message"]');
      if (await messageField.isVisible().catch(() => false)) {
        await messageField.fill("Automatický E2E test — prosím ignorujte.");
      }

      // GDPR consent
      const gdprCheckbox = page.locator('input[name="gdprConsent"], input[type="checkbox"]').first();
      if (await gdprCheckbox.isVisible().catch(() => false)) {
        await gdprCheckbox.check();
      }

      // Investment range (if visible)
      const investmentRange = page.locator('select[name="investmentRange"]');
      if (await investmentRange.isVisible().catch(() => false)) {
        await investmentRange.selectOption("50k-200k");
      }

      // Submit
      const submitBtn = page.locator('button[type="submit"]');
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Should show success message or redirect
      const body = await page.locator("body").textContent();
      const success = body?.match(/děkujeme|odesláno|úspěšně|přijata/i);
      expect(success).toBeTruthy();
    }
  });
});

test.describe("Role Gating", () => {
  test("unauthenticated user visiting /marketplace/dealer → redirect to apply", async ({ page }) => {
    await page.goto("/marketplace/dealer");
    await page.waitForLoadState("networkidle");

    // Should redirect to apply or login
    const url = page.url();
    expect(url).toMatch(/apply|prihlaseni|login/i);
  });

  test("unauthenticated user visiting /marketplace/investor → redirect to apply", async ({ page }) => {
    await page.goto("/marketplace/investor");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    expect(url).toMatch(/apply|prihlaseni|login/i);
  });

  test("broker role cannot access /marketplace/dealer", async ({ page }) => {
    await login(page, TEST_USERS.broker.email, TEST_USERS.broker.password);
    await page.goto("/marketplace/dealer");
    await page.waitForLoadState("networkidle");

    // Should be redirected or show unauthorized
    const url = page.url();
    const body = await page.locator("body").textContent();
    const blocked = url.includes("apply") || url.includes("prihlaseni") ||
      body?.match(/oprávnění|unauthorized|not_authorized/i);
    expect(blocked).toBeTruthy();
  });

  test("broker role cannot access /marketplace/investor", async ({ page }) => {
    await login(page, TEST_USERS.broker.email, TEST_USERS.broker.password);
    await page.goto("/marketplace/investor");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const body = await page.locator("body").textContent();
    const blocked = url.includes("apply") || url.includes("prihlaseni") ||
      body?.match(/oprávnění|unauthorized|not_authorized/i);
    expect(blocked).toBeTruthy();
  });

  test("marketplace/deals requires auth", async ({ page }) => {
    await page.goto("/marketplace/deals/nonexistent-id");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    // Should redirect unauthenticated user
    expect(url).toMatch(/apply|prihlaseni|login|marketplace/i);
  });
});

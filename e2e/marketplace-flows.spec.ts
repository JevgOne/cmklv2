/**
 * Marketplace — test jako investor i realizátor
 * Spustit: npx playwright test e2e/marketplace-flows.spec.ts --headed --project=chromium --workers=1
 */

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.use({
  viewport: { width: 1280, height: 900 },
  actionTimeout: 15_000,
  navigationTimeout: 20_000,
});

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");
  const cookieBtn = page.locator('button:has-text("Přijmout vše")');
  if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieBtn.click();
    await page.waitForTimeout(500);
  }
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);
}

test("Marketplace landing page", async ({ page }) => {
  await page.goto(`${BASE}/marketplace`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "/tmp/marketplace-landing.png", fullPage: true });

  // Ověřit klíčové sekce
  const body = await page.locator("body").innerText();
  console.log("MARKETPLACE LANDING:", body.substring(0, 500));

  // Nesmí obsahovat "dealer" (mělo by být "realizátor")
  const hasOldDealer = body.match(/\bdealer\b/i);
  console.log("  Contains 'dealer':", !!hasOldDealer);
  console.log("  Contains 'realizátor':", body.includes("realizátor") || body.includes("Realizátor"));

  await expect(page.locator("h1")).toContainText("Investujte");
});

test("Investor dashboard — přihlášení jako investor", async ({ page }) => {
  await login(page, "investor1@carmakler.cz", "heslo123");
  await page.goto(`${BASE}/marketplace/investor`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "/tmp/marketplace-investor.png", fullPage: true });

  const body = await page.locator("body").innerText();
  console.log("INVESTOR DASHBOARD:", body.substring(0, 500));

  await expect(page.locator("h1")).toContainText("Investiční přehled");
});

test("Realizátor dashboard — přihlášení jako dealer", async ({ page }) => {
  await login(page, "dealer1@carmakler.cz", "heslo123");
  await page.goto(`${BASE}/marketplace/dealer`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "/tmp/marketplace-dealer.png", fullPage: true });

  const body = await page.locator("body").innerText();
  console.log("REALIZÁTOR DASHBOARD:", body.substring(0, 500));

  // Breadcrumb by měl říkat "Realizátor" ne "Dealer"
  console.log("  Contains 'Realizátor' in breadcrumb:", body.includes("Realizátor"));
});

test("Realizátor — nová příležitost (formulář)", async ({ page }) => {
  await login(page, "dealer1@carmakler.cz", "heslo123");
  await page.goto(`${BASE}/marketplace/dealer/nova`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "/tmp/marketplace-nova.png", fullPage: true });

  const body = await page.locator("body").innerText();
  console.log("NOVÁ PŘÍLEŽITOST:", body.substring(0, 500));

  // Měl by být wizard/formulář
  await expect(page.locator("h1")).toContainText("Přidat novou příležitost");
});

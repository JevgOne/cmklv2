import type { Page } from "@playwright/test";

/**
 * Dismiss cookie consent banner if visible.
 */
export async function dismissCookieConsent(page: Page) {
  const cookieBtn = page.locator('button:has-text("Přijmout vše")');
  if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieBtn.click();
    await page.waitForTimeout(300);
  }
}

/**
 * Login via /prihlaseni form.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/prihlaseni");
  await page.waitForLoadState("networkidle");
  await dismissCookieConsent(page);
  await page.locator('input[type="email"], input[name="email"]').fill(email);
  await page.locator('input[type="password"], input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
}

/**
 * Test credentials — match seed data.
 * If seed hasn't been run, tests that need auth will be skipped.
 */
export const TEST_USERS = {
  admin: { email: "admin@carmakler.cz", password: "heslo123" },
  dealer: { email: "dealer1@carmakler.cz", password: "heslo123" },
  investor: { email: "investor1@carmakler.cz", password: "heslo123" },
  broker: { email: "makler1@carmakler.cz", password: "heslo123" },
} as const;

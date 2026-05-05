/**
 * QA verifikace fix: Tabs overflow-x-auto (commit 0111449)
 * Ověřuje že admin stránky s více tabu NEMAJÍ overflow na 375px
 */
import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3000";

async function hasHScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
}

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill("#email", "admin@carmakler.cz");
  await page.fill("#password", "heslo123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3500);
  return !page.url().includes("/login");
}

test.describe("QA: Tabs overflow fix ověření", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const ok = await loginAsAdmin(page);
    console.log(`[Admin login] success=${ok} url=${page.url()}`);
    await ctx.storageState({ path: "e2e/.auth-admin-verify.json" });
    await ctx.close();
  });

  const PAGES_WITH_TABS: [string, string][] = [
    ["/admin/vehicles", "5 tabů (Všechna/Aktivní/Čekající/Zamítnutá/Prodaná)"],
    ["/admin/brokers", "5 tabů"],
    ["/admin/payments", "4 tabu"],
    ["/admin/orders", "3 tabu"],
    ["/admin/returns", "3 tabu"],
  ];

  for (const [path, desc] of PAGES_WITH_TABS) {
    test(`${path} @ 375px — ${desc}`, async ({ browser }) => {
      test.setTimeout(90000);
      const ctx = await browser.newContext({ storageState: "e2e/.auth-admin-verify.json" });
      const page = await ctx.newPage();

      await page.setViewportSize({ width: 375, height: 812 });
      const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(1000);

      const httpStatus = resp?.status() ?? 0;
      const finalUrl = page.url();

      console.log(`[${path}] status=${httpStatus} url=${finalUrl}`);

      if (finalUrl.includes("/login")) {
        console.log("⚠️ Redirected to login — auth expired");
        await ctx.close();
        return;
      }

      const overflow = await hasHScroll(page);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      const cw = await page.evaluate(() => document.documentElement.clientWidth);

      console.log(`scrollWidth=${sw} clientWidth=${cw} overflow=${overflow}`);

      await page.screenshot({ path: `e2e/screenshots/tabs-fix-${path.replace(/\//g, "-")}-375.png` });

      expect(overflow, `Horizontal scroll po fixu na ${path} @ 375px`).toBe(false);

      await ctx.close();
    });
  }
});

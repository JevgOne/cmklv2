/**
 * TEST-NEW-006 FÁZE 7 — PWA Makléř responzivita
 * Login: jan.novak@carmakler.cz / heslo123
 */
import { test, Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const BP = [375, 768, 1280] as const;

type Result = { status: string; num: number; url: string; bp: number; note: string };
const pwaResults: Result[] = [];

function icon(s: string) {
  return s === "PASS" ? "✅" : s === "REDIRECT" ? "🔒" : s === "STUB" ? "🔲" : s === "FAIL" ? "❌" : "⚠️";
}

async function hasHScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
}

async function testPage(page: Page, num: number, path: string, bp: number): Promise<Result> {
  try {
    await page.setViewportSize({ width: bp, height: bp <= 375 ? 812 : bp <= 768 ? 1024 : 900 });
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(800);

    const httpStatus = resp?.status() ?? 0;
    const finalUrl = page.url();

    if (finalUrl.includes("/login") || finalUrl.includes("/prihlaseni")) {
      return { status: "REDIRECT", num, url: path, bp, note: "→ login redirect" };
    }
    if (httpStatus === 404) {
      return { status: "STUB", num, url: path, bp, note: "HTTP 404" };
    }
    if (httpStatus >= 500) {
      return { status: "FAIL", num, url: path, bp, note: `HTTP ${httpStatus} Server Error` };
    }
    const overflow = await hasHScroll(page);
    if (overflow) {
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      return { status: "FAIL", num, url: path, bp, note: `Horizontal scroll! ${sw}px` };
    }
    return { status: "PASS", num, url: path, bp, note: "OK" };
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 80) : String(e).slice(0, 80);
    return { status: "ERROR", num, url: path, bp, note: msg };
  }
}

const PWA_PAGES: [number, string][] = [
  [124, "/makler/dashboard"],
  [125, "/makler/vehicles"],
  [129, "/makler/vehicles/new"],
  [130, "/makler/vehicles/new/vin"],
  [133, "/makler/vehicles/new/photos"],
  [139, "/makler/contracts"],
  [143, "/makler/contacts"],
  [146, "/makler/leads"],
  [148, "/makler/messages"],
  [150, "/makler/commissions"],
  [152, "/makler/financing-calculator"],
  [153, "/makler/leaderboard"],
  [154, "/makler/stats"],
  [155, "/makler/profile"],
  [156, "/makler/settings"],
  [159, "/makler/blog"],
];

test.describe("FÁZE 7 — PWA Makléř", () => {
  // Login and save auth state
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#email", "jan.novak@carmakler.cz");
    await page.fill("#password", "heslo123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    console.log(`[Broker login] URL: ${page.url()}`);
    await ctx.storageState({ path: "e2e/.auth-broker.json" });
    await ctx.close();
  });

  for (const [num, path] of PWA_PAGES) {
    test(`PWA #${num} ${path}`, async ({ browser }) => {
      test.setTimeout(90000);
      const ctx = await browser.newContext({ storageState: "e2e/.auth-broker.json" });
      const page = await ctx.newPage();

      for (const bp of BP) {
        const r = await testPage(page, num, path, bp);
        pwaResults.push(r);
        console.log(`${icon(r.status)} #${num} ${path} @ ${bp}px — ${r.note}`);
        if (r.status === "FAIL") {
          await page.screenshot({ path: `e2e/screenshots/FAIL-pwa-${num}-${bp}.png` }).catch(() => {});
        }
      }
      await ctx.close();
    });
  }
});

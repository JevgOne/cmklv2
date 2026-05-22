/**
 * TEST-NEW-006 FÁZE 6 — Admin responzivita
 * Login: admin@carmakler.cz / heslo123
 */
import { test, Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const BP = [375, 768, 1280] as const;

type Result = { status: string; num: number; url: string; bp: number; note: string; priority?: string };
const adminResults: Result[] = [];

function icon(s: string) {
  return s === "PASS" ? "✅" : s === "REDIRECT" ? "🔒" : s === "STUB" ? "🔲" : s === "FAIL" ? "❌" : "⚠️";
}

async function hasHScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
}

async function testPage(page: Page, num: number, path: string, bp: number): Promise<Result> {
  try {
    await page.setViewportSize({ width: bp, height: bp <= 375 ? 812 : bp <= 768 ? 1024 : 900 });
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(800);

    const httpStatus = resp?.status() ?? 0;
    const finalUrl = page.url();

    if (finalUrl.includes("/login") || finalUrl.includes("/prihlaseni")) {
      return { status: "REDIRECT", num, url: path, bp, note: "→ login redirect" };
    }
    if (httpStatus === 404) {
      return { status: "STUB", num, url: path, bp, note: "HTTP 404", priority: "P3" };
    }
    if (httpStatus >= 500) {
      return { status: "FAIL", num, url: path, bp, note: `HTTP ${httpStatus}`, priority: "P1" };
    }
    const overflow = await hasHScroll(page);
    if (overflow) {
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      return { status: "FAIL", num, url: path, bp, note: `Horizontal scroll! ${sw}px`, priority: "P1" };
    }
    return { status: "PASS", num, url: path, bp, note: "OK" };
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 80) : String(e).slice(0, 80);
    return { status: "ERROR", num, url: path, bp, note: msg };
  }
}

const ADMIN_PAGES: [number, string][] = [
  [79, "/admin/dashboard"],
  [80, "/admin/vehicles"],
  [84, "/admin/brokers"],
  [87, "/admin/inzerce"],
  [89, "/admin/leads"],
  [91, "/admin/users"],
  [92, "/admin/payments"],
  [94, "/admin/orders"],
  [95, "/admin/returns"],
  [97, "/admin/parts"],
  [98, "/admin/suppliers"],
  [102, "/admin/partners"],
  [105, "/admin/marketplace"],
  [107, "/admin/marketplace/applications"],
  [108, "/admin/blog"],
  [111, "/admin/blog/comments"],
  [112, "/admin/reviews"],
  [113, "/admin/team"],
  [114, "/admin/career"],
  [116, "/admin/notifications"],
  [117, "/admin/profile"],
];

// Login once, then run each page as separate test for better isolation
test.describe("FÁZE 6 — Admin", () => {
  test.use({ storageState: undefined });

  // Login a ulož auth state
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#email", "admin@carmakler.cz");
    await page.fill("#password", "heslo123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    const url = page.url();
    console.log(`[Admin beforeAll] post-login URL: ${url}`);
    // Save storage state
    await context.storageState({ path: "e2e/.auth-admin.json" });
    await context.close();
  });

  for (const [num, path] of ADMIN_PAGES) {
    test(`Admin #${num} ${path}`, async ({ browser }) => {
      test.setTimeout(180000);
      // Use saved auth state
      const context = await browser.newContext({ storageState: "e2e/.auth-admin.json" });
      const page = await context.newPage();

      for (const bp of BP) {
        const r = await testPage(page, num, path, bp);
        adminResults.push(r);
        console.log(`${icon(r.status)} #${num} ${path} @ ${bp}px — ${r.note}`);
        if (r.status === "FAIL") {
          await page.screenshot({ path: `e2e/screenshots/FAIL-admin-${num}-${bp}.png` }).catch(() => {});
        }
      }
      await context.close();
    });
  }
});

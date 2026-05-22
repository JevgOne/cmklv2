/**
 * TEST-NEW-006 PRODUKCE — carmakler.cz
 * Fáze 2-7 responzivita na produkčním serveru
 * Breakpointy: 375px, 768px, 1280px
 */
import { test, Page } from "@playwright/test";

const BASE = "https://carmakler.cz";
const BP = [375, 768, 1280] as const;

type Result = {
  status: string;
  num: number;
  url: string;
  bp: number;
  note: string;
  priority?: string;
};

const allResults: Result[] = [];

function icon(s: string) {
  return s === "PASS" ? "✅" : s === "REDIRECT" ? "🔒" : s === "STUB" ? "🔲" : s === "FAIL" ? "❌" : "⚠️";
}

async function hasHScroll(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  );
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

// ── FÁZE 2-5: Veřejné stránky ──────────────────────────────────────────────
const PUBLIC_PAGES: [number, string][] = [
  [8, "/"],
  [9, "/o-nas"],
  [10, "/jak-to-funguje"],
  [11, "/kontakt"],
  [12, "/cenik"],
  [13, "/chci-prodat"],
  [14, "/jak-prodat-auto"],
  [15, "/kolik-stoji-moje-auto"],
  [16, "/recenze"],
  [17, "/kariera"],
  [18, "/blog"],
  [21, "/sluzby"],
  [22, "/sluzby/proverka"],
  [23, "/sluzby/financovani"],
  [24, "/sluzby/pojisteni"],
  [25, "/makleri"],
  [27, "/nabidka"],
  [29, "/nabidka/porovnani"],
  [33, "/prihlaseni"],
  [35, "/registrace"],
  [39, "/zapomenute-heslo"],
  [47, "/inzerce"],
  [48, "/inzerce/katalog"],
  [49, "/inzerce/registrace"],
  [50, "/inzerce/pridat"],
  [53, "/shop/katalog"],
  [55, "/shop/kosik"],
  [60, "/dily"],
  [61, "/dily/katalog"],
  [67, "/dily/kosik"],
  [68, "/dily/objednavka"],
  [71, "/marketplace"],
  [72, "/marketplace/apply"],
  [73, "/marketplace/dealer"],
  [76, "/marketplace/investor"],
  [190, "/obchodni-podminky"],
  [191, "/ochrana-osobnich-udaju"],
  [192, "/reklamacni-rad"],
  [193, "/zasady-cookies"],
];

test.describe("FÁZE 2-5 — Veřejné stránky (produkce)", () => {
  for (const [num, path] of PUBLIC_PAGES) {
    test(`#${num} ${path}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      for (const bp of BP) {
        const r = await testPage(page, num, path, bp);
        allResults.push(r);
        console.log(`${icon(r.status)} #${num} ${path} @ ${bp}px — ${r.note}`);
        if (r.status === "FAIL") {
          await page.screenshot({ path: `e2e/screenshots/PROD-FAIL-${num}-${bp}.png` }).catch(() => {});
        }
      }
      await ctx.close();
    });
  }
});

// ── FÁZE 6: Admin ──────────────────────────────────────────────────────────
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

test.describe("FÁZE 6 — Admin (produkce)", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#email", "admin@carmakler.cz");
    await page.fill("#password", "heslo123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    const url = page.url();
    console.log(`[Admin login] url: ${url}`);
    await ctx.storageState({ path: "e2e/.auth-admin-prod.json" });
    await ctx.close();
  });

  for (const [num, path] of ADMIN_PAGES) {
    test(`Admin #${num} ${path}`, async ({ browser }) => {
      test.setTimeout(180000);
      const ctx = await browser.newContext({ storageState: "e2e/.auth-admin-prod.json" });
      const page = await ctx.newPage();
      for (const bp of BP) {
        const r = await testPage(page, num, path, bp);
        allResults.push(r);
        console.log(`${icon(r.status)} #${num} ${path} @ ${bp}px — ${r.note}`);
        if (r.status === "FAIL") {
          await page.screenshot({ path: `e2e/screenshots/PROD-FAIL-admin-${num}-${bp}.png` }).catch(() => {});
        }
      }
      await ctx.close();
    });
  }
});

// ── FÁZE 7: PWA Makléř ─────────────────────────────────────────────────────
const PWA_PAGES: [number, string][] = [
  [124, "/makler/dashboard"],
  [125, "/makler/vehicles"],
  [129, "/makler/vehicles/new"],
  [130, "/makler/vehicles/new/vin"],
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

test.describe("FÁZE 7 — PWA Makléř (produkce)", () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
    await page.fill("#email", "jan.novak@carmakler.cz");
    await page.fill("#password", "heslo123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    const url = page.url();
    console.log(`[Broker login] url: ${url}`);
    await ctx.storageState({ path: "e2e/.auth-broker-prod.json" });
    await ctx.close();
  });

  for (const [num, path] of PWA_PAGES) {
    test(`PWA #${num} ${path}`, async ({ browser }) => {
      test.setTimeout(120000);
      const ctx = await browser.newContext({ storageState: "e2e/.auth-broker-prod.json" });
      const page = await ctx.newPage();
      for (const bp of BP) {
        const r = await testPage(page, num, path, bp);
        allResults.push(r);
        console.log(`${icon(r.status)} #${num} ${path} @ ${bp}px — ${r.note}`);
        if (r.status === "FAIL") {
          await page.screenshot({ path: `e2e/screenshots/PROD-FAIL-pwa-${num}-${bp}.png` }).catch(() => {});
        }
      }
      await ctx.close();
    });
  }
});

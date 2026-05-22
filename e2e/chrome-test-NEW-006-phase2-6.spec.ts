/**
 * TEST-NEW-006 FÁZE 2-6 — Responzivita auth + veřejné stránky
 * Přihlašovací údaje: admin@carmakler.cz / heslo123, jan.novak@carmakler.cz / heslo123
 */
import { test, Page } from "@playwright/test";

const BASE = "http://localhost:3000";
const BP = [375, 768, 1280] as const;

// Global results store
const allResults: {
  status: string; num: number; url: string; bp: number; note: string; priority?: string;
}[] = [];

async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  );
}

async function testPage(
  page: Page, num: number, path: string, bp: number, extraNote = ""
): Promise<{ status: string; note: string; priority?: string }> {
  try {
    await page.setViewportSize({ width: bp, height: bp <= 375 ? 812 : bp <= 768 ? 1024 : 900 });
    const response = await page.goto(`${BASE}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(500);

    const httpStatus = response?.status() ?? 0;
    const finalUrl = page.url();
    const isLoginRedirect = finalUrl.includes("/prihlaseni") || finalUrl.includes("/login");

    if (isLoginRedirect) {
      return { status: "REDIRECT", note: "→ vyžaduje přihlášení" };
    }
    if (httpStatus === 404) {
      return { status: "STUB", note: "HTTP 404", priority: "P3" };
    }
    if (httpStatus >= 500) {
      return { status: "FAIL", note: `HTTP ${httpStatus} Server Error`, priority: "P1" };
    }

    const overflow = await hasHorizontalScroll(page);
    if (overflow) {
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      return { status: "FAIL", note: `Horizontal scroll! scrollWidth=${sw}px ${extraNote}`, priority: "P1" };
    }

    return { status: "PASS", note: extraNote || "OK" };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message.slice(0, 100) : String(e).slice(0, 100);
    return { status: "ERROR", note: msg };
  }
}

function log(r: { status: string; num: number; url: string; bp: number; note: string }) {
  const icon = r.status === "PASS" ? "✅" : r.status === "REDIRECT" ? "🔒" : r.status === "STUB" ? "🔲" : r.status === "FAIL" ? "❌" : "⚠️";
  console.log(`${icon} #${r.num} ${r.url} @ ${r.bp}px — ${r.note}`);
}

async function loginAs(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto(`${BASE}/prihlaseni`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(800);
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(1500);
  const finalUrl = page.url();
  return !finalUrl.includes("/prihlaseni") && !finalUrl.includes("/login");
}

// ============================================================
// FÁZE 2 — Hlavní web veřejné stránky
// ============================================================
test.describe("FÁZE 2 — Hlavní web", () => {
  test.setTimeout(120000);

  const pages: [number, string][] = [
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
    [40, "/muj-ucet"],
    [190, "/obchodni-podminky"],
    [191, "/ochrana-osobnich-udaju"],
    [192, "/reklamacni-rad"],
    [193, "/zasady-cookies"],
  ];

  for (const [num, path] of pages) {
    test(`#${num} ${path}`, async ({ page }) => {
      test.setTimeout(60000);
      for (const bp of BP) {
        const r = await testPage(page, num, path, bp);
        const rec = { status: r.status, num, url: path, bp, note: r.note, priority: r.priority };
        allResults.push(rec);
        log(rec);
      }
    });
  }
});

// ============================================================
// FÁZE 3 — Inzerce
// ============================================================
test.describe("FÁZE 3 — Inzerce", () => {
  const pages: [number, string][] = [
    [47, "/inzerce"],
    [48, "/inzerce/katalog"],
    [49, "/inzerce/registrace"],
    [50, "/inzerce/pridat"],
    [51, "/moje-inzeraty"],
  ];

  for (const [num, path] of pages) {
    test(`#${num} ${path}`, async ({ page }) => {
      test.setTimeout(60000);
      for (const bp of BP) {
        const r = await testPage(page, num, path, bp);
        const rec = { status: r.status, num, url: path, bp, note: r.note, priority: r.priority };
        allResults.push(rec);
        log(rec);
      }
    });
  }
});

// ============================================================
// FÁZE 4 — Eshop
// ============================================================
test.describe("FÁZE 4 — Eshop", () => {
  const pages: [number, string][] = [
    [53, "/shop/katalog"],
    [55, "/shop/kosik"],
    [60, "/dily"],
    [61, "/dily/katalog"],
    [67, "/dily/kosik"],
    [68, "/dily/objednavka"],
    [69, "/dily/moje-objednavky"],
  ];

  for (const [num, path] of pages) {
    test(`#${num} ${path}`, async ({ page }) => {
      test.setTimeout(60000);
      for (const bp of BP) {
        const r = await testPage(page, num, path, bp);
        const rec = { status: r.status, num, url: path, bp, note: r.note, priority: r.priority };
        allResults.push(rec);
        log(rec);
      }
    });
  }
});

// ============================================================
// FÁZE 5 — Marketplace (veřejná část)
// ============================================================
test.describe("FÁZE 5 — Marketplace", () => {
  const pages: [number, string][] = [
    [71, "/marketplace"],
    [72, "/marketplace/apply"],
    [73, "/marketplace/dealer"],
    [76, "/marketplace/investor"],
  ];

  for (const [num, path] of pages) {
    test(`#${num} ${path}`, async ({ page }) => {
      test.setTimeout(60000);
      for (const bp of BP) {
        const r = await testPage(page, num, path, bp);
        const rec = { status: r.status, num, url: path, bp, note: r.note, priority: r.priority };
        allResults.push(rec);
        log(rec);
      }
    });
  }
});

// ============================================================
// FÁZE 6 — Admin (přihlášení jako ADMIN)
// ============================================================
test.describe("FÁZE 6 — Admin", () => {
  test.setTimeout(300000);

  const adminPages: [number, string][] = [
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

  test("Admin login + všechny stránky", async ({ page }) => {
    // Login
    const ok = await loginAs(page, "admin@carmakler.cz", "heslo123");
    console.log(`[ADMIN login] success=${ok} url=${page.url()}`);

    for (const [num, path] of adminPages) {
      for (const bp of BP) {
        const r = await testPage(page, num, path, bp);
        const rec = { status: r.status, num, url: path, bp, note: r.note, priority: r.priority };
        allResults.push(rec);
        log(rec);
        if (r.status === "FAIL") {
          await page.screenshot({
            path: `e2e/screenshots/FAIL-admin-${num}-${bp}.png`,
            fullPage: false,
          }).catch(() => {});
        }
      }
    }

    // Shrnutí
    const fails = allResults.filter(r => r.url.startsWith("/admin") && r.status === "FAIL");
    console.log(`[ADMIN] FAILS: ${fails.length}`);
    fails.forEach(f => console.error(`❌ FAIL: #${f.num} ${f.url} @ ${f.bp}px — ${f.note}`));
  });
});

// ============================================================
// FÁZE 7 — PWA Makléř (přihlášení jako BROKER)
// ============================================================
test.describe("FÁZE 7 — PWA Makléř", () => {
  test.setTimeout(300000);

  const pwaPages: [number, string][] = [
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

  test("Broker login + PWA stránky", async ({ page }) => {
    const ok = await loginAs(page, "jan.novak@carmakler.cz", "heslo123");
    console.log(`[BROKER login] success=${ok} url=${page.url()}`);

    for (const [num, path] of pwaPages) {
      for (const bp of BP) {
        const r = await testPage(page, num, path, bp);
        const rec = { status: r.status, num, url: path, bp, note: r.note, priority: r.priority };
        allResults.push(rec);
        log(rec);
        if (r.status === "FAIL") {
          await page.screenshot({
            path: `e2e/screenshots/FAIL-pwa-${num}-${bp}.png`,
            fullPage: false,
          }).catch(() => {});
        }
      }
    }

    const fails = allResults.filter(r => r.url.startsWith("/makler") && r.status === "FAIL");
    console.log(`[BROKER] FAILS: ${fails.length}`);
    fails.forEach(f => console.error(`❌ FAIL: #${f.num} ${f.url} @ ${f.bp}px — ${f.note}`));
  });
});

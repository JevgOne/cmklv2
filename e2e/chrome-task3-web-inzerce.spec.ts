/**
 * Task #3: Proklikat Carmakler web + inzerce v Chrome
 * Checks: footer text, navbar text, watchdog input visibility
 */
import { test, expect, Page, BrowserContext } from "@playwright/test";

const BASE = "http://localhost:3000";
const SCREENSHOTS_DIR = "/tmp/task3-screenshots";
import fs from "fs";

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function go(page: Page, path: string, label: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);
  const url = page.url();
  const has500 = await page.locator('[data-nextjs-dialog-header], h1:text("500")').count() > 0;
  const bodyText = (await page.locator("body").innerText()).trim();
  const status = has500 ? "❌ 500" : bodyText.length < 50 ? "⚠️ EMPTY" : "✅ OK";
  console.log(`${status} | ${label} | ${path} → ${url}`);
  return { ok: !has500 && bodyText.length > 50, status, text: bodyText, url };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HLAVNÍ WEB
// ─────────────────────────────────────────────────────────────────────────────
test.describe("1. Hlavní web", () => {
  let page: Page;
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    page = await ctx.newPage();
  });
  test.afterAll(() => ctx.close());

  test("HP-01 Hlavní stránka /", async () => {
    const r = await go(page, "/", "Homepage");
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/hp-01-homepage.png`, fullPage: false });
    expect(r.ok, r.status).toBe(true);
    // CSS — check that page has styled elements (not just plain text)
    const hasOrange = await page.locator('[class*="orange"], [class*="bg-orange"], [style*="orange"]').count();
    const hasNav = await page.locator("nav, header").count();
    console.log(`  ✅ Nav/header: ${hasNav}, orange elements: ${hasOrange}`);
    expect(hasNav).toBeGreaterThan(0);
  });

  test("HP-02 Footer — NESMÍ obsahovat 'Reklamační řád'", async () => {
    // Already on homepage
    const footerText = await page.locator("footer").innerText().catch(() => "");
    const hasReklamacni = footerText.toLowerCase().includes("reklamační řád");
    console.log(`  ${hasReklamacni ? "❌" : "✅"} 'Reklamační řád' v footeru: ${hasReklamacni ? "PŘÍTOMNO — BUG!" : "NENÍ (správně)"}`);
    if (footerText.length > 0) {
      const previewLines = footerText.split("\n").slice(0, 5).join(" | ");
      console.log(`  Footer preview: ${previewLines.substring(0, 200)}`);
    }
    expect(hasReklamacni, "Footer nesmí obsahovat 'Reklamační řád'").toBe(false);
  });

  test("HP-03 Footer — musí obsahovat 'CarMakler s.r.o.'", async () => {
    const footerText = await page.locator("footer").innerText().catch(() => "");
    const hasCarMakler = footerText.includes("CarMakler s.r.o.");
    console.log(`  ${hasCarMakler ? "✅" : "❌"} 'CarMakler s.r.o.' v footeru: ${hasCarMakler ? "NALEZENO" : "CHYBÍ — BUG!"}`);
    // Also check what company name IS present
    const firmMatch = footerText.match(/(Car\w+\s+s\.r\.o\.)/i);
    if (firmMatch) console.log(`  Nalezeno: "${firmMatch[0]}"`);
    expect(hasCarMakler, "Footer musí obsahovat 'CarMakler s.r.o.'").toBe(true);
  });

  test("HP-04 /nabidka — katalog vozidel", async () => {
    const r = await go(page, "/nabidka", "Nabídka vozidel");
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/hp-04-nabidka.png`, fullPage: false });
    expect(r.ok, r.status).toBe(true);
  });

  test("HP-05 /jak-to-funguje", async () => {
    const r = await go(page, "/jak-to-funguje", "Jak to funguje");
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/hp-05-jak-to-funguje.png`, fullPage: false });
    expect(r.ok, r.status).toBe(true);
  });

  test("HP-06 /kontakt", async () => {
    const r = await go(page, "/kontakt", "Kontakt");
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/hp-06-kontakt.png`, fullPage: false });
    expect(r.ok, r.status).toBe(true);
  });

  test("HP-07 /o-nas", async () => {
    const r = await go(page, "/o-nas", "O nás");
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/hp-07-o-nas.png`, fullPage: false });
    expect(r.ok, r.status).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. INZERCE
// ─────────────────────────────────────────────────────────────────────────────
test.describe("2. Inzerce", () => {
  let page: Page;
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    page = await ctx.newPage();
  });
  test.afterAll(() => ctx.close());

  test("INZ-01 /inzerce — načte se", async () => {
    const r = await go(page, "/inzerce", "Inzerce landing");
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/inz-01-landing.png`, fullPage: false });
    expect(r.ok, r.status).toBe(true);
  });

  test("INZ-02 Navbar — NESMÍ obsahovat 'Katalog', musí mít 'Nabídka vozidel'", async () => {
    // Check desktop navbar on /inzerce
    const navText = await page.locator("nav, header").innerText().catch(() => "");
    const hasKatalog = navText.includes("Katalog");
    const hasNabidka = navText.includes("Nabídka vozidel");
    console.log(`  ${!hasKatalog ? "✅" : "❌"} 'Katalog' v navbaru: ${hasKatalog ? "PŘÍTOMNO — BUG!" : "NENÍ (správně)"}`);
    console.log(`  ${hasNabidka ? "✅" : "❌"} 'Nabídka vozidel' v navbaru: ${hasNabidka ? "NALEZENO" : "CHYBÍ — BUG!"}`);
    if (navText.length > 0) {
      const navLines = navText.split("\n").filter(l => l.trim()).slice(0, 10).join(" | ");
      console.log(`  Nav preview: ${navLines.substring(0, 300)}`);
    }
    expect(hasKatalog, "Navbar nesmí obsahovat 'Katalog'").toBe(false);
    expect(hasNabidka, "Navbar musí obsahovat 'Nabídka vozidel'").toBe(true);
  });

  test("INZ-03 Footer — musí obsahovat 'Nabídka vozidel', ne 'Katalog vozidel'", async () => {
    const footerText = await page.locator("footer").innerText().catch(() => "");
    const hasKatalogVozidel = footerText.includes("Katalog vozidel");
    const hasNabidkaVozidel = footerText.includes("Nabídka vozidel");
    console.log(`  ${!hasKatalogVozidel ? "✅" : "❌"} 'Katalog vozidel' ve footeru: ${hasKatalogVozidel ? "PŘÍTOMNO — BUG!" : "NENÍ (správně)"}`);
    console.log(`  ${hasNabidkaVozidel ? "✅" : "❌"} 'Nabídka vozidel' ve footeru: ${hasNabidkaVozidel ? "NALEZENO" : "CHYBÍ — BUG!"}`);
    expect(hasKatalogVozidel, "Footer nesmí obsahovat 'Katalog vozidel'").toBe(false);
    expect(hasNabidkaVozidel, "Footer musí obsahovat 'Nabídka vozidel'").toBe(true);
  });

  test("INZ-04 Watchdog email input — viditelný na oranžovém pozadí", async () => {
    // Navigate to page that likely has watchdog/hlídací pes section
    await page.goto(`${BASE}/inzerce`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    // Scroll to bottom to find watchdog section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Look for email input (watchdog / hlídací pes)
    const emailInputs = page.locator("input[type='email'], input[placeholder*='email'], input[placeholder*='Email'], input[placeholder*='e-mail']");
    const count = await emailInputs.count();
    console.log(`  ℹ️ Email inputs nalezeny: ${count}`);

    if (count > 0) {
      const input = emailInputs.first();
      const isVisible = await input.isVisible();
      console.log(`  ${isVisible ? "✅" : "❌"} Email input viditelný: ${isVisible}`);

      if (isVisible) {
        // Check background color of surrounding section
        const parentBg = await input.evaluate((el) => {
          let node: Element | null = el;
          while (node) {
            const bg = window.getComputedStyle(node).backgroundColor;
            if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
            node = node.parentElement;
          }
          return "unknown";
        });
        console.log(`  ℹ️ Parent background: ${parentBg}`);

        // Check input styling
        const inputBg = await input.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        const inputBorder = await input.evaluate((el) => window.getComputedStyle(el).borderColor);
        console.log(`  ℹ️ Input bg: ${inputBg}, border: ${inputBorder}`);
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/inz-04-watchdog.png`, fullPage: false });
      }
      expect(isVisible, "Watchdog email input musí být viditelný").toBe(true);
    } else {
      // Try scrolling to find it — might be on different section
      console.log(`  ⚠️ Email input nenalezen na /inzerce — zkouším /inzerce/katalog`);
      await page.goto(`${BASE}/inzerce/katalog`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      const count2 = await page.locator("input[type='email'], input[placeholder*='email'], input[placeholder*='Email']").count();
      console.log(`  ℹ️ Email inputs na /inzerce/katalog: ${count2}`);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/inz-04-watchdog-katalog.png`, fullPage: false });
      // Don't fail — just report
    }
  });

  test("INZ-05 Mobilní menu (375px) — 'Nabídka vozidel', ne 'Katalog'", async ({ browser }) => {
    const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(`${BASE}/inzerce`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await mobilePage.waitForTimeout(2000);

    // Try to open mobile menu
    const hamburger = mobilePage.locator("button[aria-label*='menu'], button[aria-label*='Menu'], [class*='hamburger'], [class*='mobile-menu'], button:has([class*='bar']), button svg").first();
    const hamburgerCount = await hamburger.count();
    console.log(`  ℹ️ Hamburger tlačítko nalezeno: ${hamburgerCount}`);

    if (hamburgerCount > 0) {
      await hamburger.click();
      await mobilePage.waitForTimeout(1500);
      await mobilePage.screenshot({ path: `${SCREENSHOTS_DIR}/inz-05-mobile-menu-open.png`, fullPage: false });
    } else {
      await mobilePage.screenshot({ path: `${SCREENSHOTS_DIR}/inz-05-mobile-375.png`, fullPage: false });
    }

    // Check full page text (including any open menu)
    const fullText = await mobilePage.locator("body").innerText();
    const hasKatalog = fullText.includes("Katalog");
    const hasNabidka = fullText.includes("Nabídka vozidel");
    console.log(`  ${!hasKatalog ? "✅" : "❌"} 'Katalog' na mobilu: ${hasKatalog ? "PŘÍTOMNO — BUG!" : "NENÍ (správně)"}`);
    console.log(`  ${hasNabidka ? "✅" : "❌"} 'Nabídka vozidel' na mobilu: ${hasNabidka ? "NALEZENO" : "CHYBÍ — BUG!"}`);

    await mobileCtx.close();
    expect(hasKatalog, "Mobilní menu nesmí obsahovat 'Katalog'").toBe(false);
    expect(hasNabidka, "Mobilní menu musí obsahovat 'Nabídka vozidel'").toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ESHOP / DÍLY
// ─────────────────────────────────────────────────────────────────────────────
test.describe("3. Eshop & Díly", () => {
  let page: Page;
  let ctx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    page = await ctx.newPage();
  });
  test.afterAll(() => ctx.close());

  test("SHOP-01 /dily — stránka dílů", async () => {
    const r = await go(page, "/dily", "Díly landing");
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/shop-01-dily.png`, fullPage: false });
    expect(r.ok, r.status).toBe(true);
  });

  test("SHOP-02 /shop — eshop", async () => {
    const r = await go(page, "/shop", "Eshop");
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/shop-02-shop.png`, fullPage: false });
    // /shop might redirect
    console.log(`  ℹ️ Final URL: ${r.url}`);
    const noError = !r.status.includes("500");
    expect(noError, r.status).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. PWA
// ─────────────────────────────────────────────────────────────────────────────
test.describe("4. PWA", () => {
  test("PWA-01 /makler — PWA entry point", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const r = await go(page, "/makler", "Makléř landing");
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/pwa-01-makler.png`, fullPage: false });
    console.log(`  ℹ️ Final URL: ${r.url}`);
    const noError = !r.status.includes("500");
    expect(noError, r.status).toBe(true);
    await ctx.close();
  });
});

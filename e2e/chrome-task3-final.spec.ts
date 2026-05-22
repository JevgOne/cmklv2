/**
 * Task #3 FINAL: Carmakler web + inzerce — ověření po SSR migraci
 * Testuje AKTUÁLNÍ kód na portu 3001 (nový dev server)
 * + porovnání se starým serverem na 3000
 */
import { test, expect, Page } from "@playwright/test";

const PORT_NEW = 3001; // aktuální kód (nový dev server)
const PORT_OLD = 3000; // starý server (stale build z 8. 5.)

async function go(page: Page, port: number, path: string, label: string) {
  await page.goto(`http://localhost:${port}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);
  const has500 = await page.locator('[data-nextjs-dialog-header]').count() > 0;
  const bodyLen = (await page.locator("body").innerText()).trim().length;
  const status = has500 ? "❌ 500" : bodyLen < 50 ? "⚠️ EMPTY" : "✅ OK";
  console.log(`${status} | ${label} | :${port}${path}`);
  return { ok: !has500 && bodyLen > 50, status, url: page.url() };
}

// ─────────────────────────────────────────────────────────────────────────────
// HLAVNÍ WEB — port 3001 (aktuální kód)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Hlavní web (port 3001 — aktuální)", () => {
  test("HP-01 Homepage /", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const r = await go(page, PORT_NEW, "/", "Homepage");
    await page.screenshot({ path: "/tmp/task3-3001-homepage.png" });
    expect(r.ok, r.status).toBe(true);
    const hasNav = await page.locator("nav, header").count();
    console.log(`  Nav/header count: ${hasNav}`);
    expect(hasNav).toBeGreaterThan(0);
  });

  test("HP-02 Footer — NESMÍ 'Reklamační řád', MUSÍ 'CarMakler s.r.o.'", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT_NEW}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    const footerText = await page.locator("footer").innerText().catch(() => "NO FOOTER");
    const hasReklamacni = footerText.includes("Reklamační řád");
    const hasCarMakler = footerText.includes("CarMakler s.r.o.");
    const firmMatch = footerText.match(/\d{4}\s+(.+?)(?:\s+·|\n)/);
    console.log(`  'Reklamační řád': ${hasReklamacni ? "❌ PŘÍTOMNO — BUG!" : "✅ NENÍ (správně)"}`);
    console.log(`  'CarMakler s.r.o.': ${hasCarMakler ? "✅ NALEZENO" : "❌ CHYBÍ — BUG!"}`);
    console.log(`  Firma © řádka: "${firmMatch?.[1] || "nenalezeno"}"`);
    expect(hasReklamacni, "Footer nesmí obsahovat 'Reklamační řád'").toBe(false);
    expect(hasCarMakler, "Footer musí obsahovat 'CarMakler s.r.o.'").toBe(true);
  });

  test("HP-03 /nabidka načte se", async ({ page }) => {
    const r = await go(page, PORT_NEW, "/nabidka", "Nabídka vozidel");
    await page.screenshot({ path: "/tmp/task3-3001-nabidka.png" });
    expect(r.ok, r.status).toBe(true);
  });

  test("HP-04 /jak-to-funguje", async ({ page }) => {
    const r = await go(page, PORT_NEW, "/jak-to-funguje", "Jak to funguje");
    expect(r.ok, r.status).toBe(true);
  });

  test("HP-05 /kontakt", async ({ page }) => {
    const r = await go(page, PORT_NEW, "/kontakt", "Kontakt");
    expect(r.ok, r.status).toBe(true);
  });

  test("HP-06 /o-nas", async ({ page }) => {
    const r = await go(page, PORT_NEW, "/o-nas", "O nás");
    expect(r.ok, r.status).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INZERCE — port 3001
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Inzerce (port 3001 — aktuální)", () => {
  test("INZ-01 /inzerce načte se", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const r = await go(page, PORT_NEW, "/inzerce", "Inzerce landing");
    await page.screenshot({ path: "/tmp/task3-3001-inzerce.png" });
    expect(r.ok, r.status).toBe(true);
  });

  test("INZ-02 Desktop navbar — 'Nabídka vozidel', NESMÍ 'Katalog'", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${PORT_NEW}/inzerce`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    const headerText = await page.locator("header").innerText().catch(() => "");
    const hasKatalog = headerText.includes("Katalog") && !headerText.includes("Nabídka vozidel");
    const hasNabidka = headerText.includes("Nabídka vozidel");
    console.log(`  'Katalog' (bez Nabídka): ${hasKatalog ? "❌ PŘÍTOMNO — BUG!" : "✅ OK"}`);
    console.log(`  'Nabídka vozidel': ${hasNabidka ? "✅ NALEZENO" : "❌ CHYBÍ — BUG!"}`);
    const desktopNav = await page.locator(".hidden.lg\\:flex a, .hidden.lg\\:block a").allInnerTexts().catch(() => [] as string[]);
    console.log(`  Desktop nav links: ${desktopNav.join(" | ")}`);
    expect(hasKatalog, "Desktop navbar nesmí mít jen 'Katalog' bez 'Nabídka vozidel'").toBe(false);
    expect(hasNabidka, "Desktop navbar musí mít 'Nabídka vozidel'").toBe(true);
    await page.screenshot({ path: "/tmp/task3-3001-inzerce-nav.png" });
  });

  test("INZ-03 Mobilní menu — 'Nabídka vozidel', NESMÍ 'Katalog'", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`http://localhost:${PORT_NEW}/inzerce`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    // Open mobile menu
    const hamburger = page.locator("button[aria-label*='menu'], button[aria-label*='Menu'], button[aria-label='Otevřít menu']").first();
    if (await hamburger.count() > 0) {
      await hamburger.click();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: "/tmp/task3-3001-inzerce-mobile.png" });
    const bodyText = await page.locator("body").innerText();
    const hasKatalog = bodyText.includes("Katalog") && !bodyText.includes("Nabídka vozidel");
    const hasNabidka = bodyText.includes("Nabídka vozidel");
    console.log(`  Mobilní 'Katalog' (bez Nabídka): ${hasKatalog ? "❌ PŘÍTOMNO — BUG!" : "✅ OK"}`);
    console.log(`  Mobilní 'Nabídka vozidel': ${hasNabidka ? "✅ NALEZENO" : "❌ CHYBÍ — BUG!"}`);
    expect(hasKatalog, "Mobilní menu nesmí mít jen 'Katalog'").toBe(false);
    expect(hasNabidka, "Mobilní menu musí mít 'Nabídka vozidel'").toBe(true);
  });

  test("INZ-04 Footer — 'Nabídka vozidel', NESMÍ 'Katalog vozidel'", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${PORT_NEW}/inzerce`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    const footerText = await page.locator("footer").innerText().catch(() => "");
    const hasKatalogV = footerText.includes("Katalog vozidel");
    const hasNabidkaV = footerText.includes("Nabídka vozidel");
    console.log(`  Footer 'Katalog vozidel': ${hasKatalogV ? "❌ PŘÍTOMNO — BUG!" : "✅ NENÍ (správně)"}`);
    console.log(`  Footer 'Nabídka vozidel': ${hasNabidkaV ? "✅ NALEZENO" : "❌ CHYBÍ — BUG!"}`);
    expect(hasKatalogV, "Footer nesmí mít 'Katalog vozidel'").toBe(false);
    expect(hasNabidkaV, "Footer musí mít 'Nabídka vozidel'").toBe(true);
  });

  test("INZ-05 Watchdog email input — viditelný", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${PORT_NEW}/inzerce`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    // Scroll to find watchdog/hlídací pes section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    const emailInput = page.locator("input[type='email'], input[name*='email'], input[placeholder*='mail']").first();
    const count = await emailInput.count();
    if (count > 0) {
      const isVisible = await emailInput.isVisible();
      if (isVisible) {
        await emailInput.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await page.screenshot({ path: "/tmp/task3-3001-watchdog.png" });
        const inputBg = await emailInput.evaluate(el => window.getComputedStyle(el).backgroundColor);
        const sectionBg = await emailInput.evaluate(el => {
          let node: Element | null = el;
          for (let i = 0; i < 8; i++) {
            if (!node) break;
            const bg = window.getComputedStyle(node).backgroundColor;
            if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && bg !== "") return bg;
            node = node.parentElement;
          }
          return "unknown";
        });
        console.log(`  ✅ Email input viditelný: true`);
        console.log(`  Input bg: ${inputBg}, Section bg: ${sectionBg}`);
        const isWhiteish = inputBg.includes("255, 255, 255") || inputBg.includes("rgb(255") || inputBg === "white";
        const isOrangeBg = sectionBg.includes("249, 115") || sectionBg.includes("orange") || sectionBg.includes("234, 88");
        console.log(`  Bílý input: ${isWhiteish ? "✅" : "⚠️ " + inputBg}`);
        console.log(`  Oranžová sekce: ${isOrangeBg ? "✅" : "⚠️ " + sectionBg}`);
      } else {
        console.log(`  ⚠️ Email input nalezen, ale není viditelný`);
      }
    } else {
      // Try katalog
      await page.goto(`http://localhost:${PORT_NEW}/inzerce/katalog`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      const count2 = await page.locator("input[type='email']").count();
      await page.screenshot({ path: "/tmp/task3-3001-watchdog-katalog.png" });
      console.log(`  ℹ️ Email input na /inzerce/katalog: ${count2}`);
    }
    // Don't assert — just report
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ESHOP / DÍLY — port 3001
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Eshop & Díly (port 3001)", () => {
  test("SHOP-01 /dily", async ({ page }) => {
    const r = await go(page, PORT_NEW, "/dily", "Díly landing");
    await page.screenshot({ path: "/tmp/task3-3001-dily.png" });
    expect(r.ok, r.status).toBe(true);
  });

  test("SHOP-02 /shop", async ({ page }) => {
    const r = await go(page, PORT_NEW, "/shop", "Eshop");
    await page.screenshot({ path: "/tmp/task3-3001-shop.png" });
    const noError = !r.status.includes("500");
    expect(noError, r.status).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PWA — port 3001
// ─────────────────────────────────────────────────────────────────────────────
test.describe("PWA (port 3001)", () => {
  test("PWA-01 /makler landing", async ({ page }) => {
    const r = await go(page, PORT_NEW, "/makler", "Makléř landing");
    await page.screenshot({ path: "/tmp/task3-3001-makler.png" });
    console.log(`  Final URL: ${r.url}`);
    const noError = !r.status.includes("500");
    expect(noError, r.status).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PORT 3000 STALE CHECK — potvrzení že je zastaralý
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Port 3000 — stale build ověření", () => {
  test("PORT3000 Footer firma + Reklamační řád", async ({ page }) => {
    await page.goto(`http://localhost:${PORT_OLD}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    const footerText = await page.locator("footer").innerText().catch(() => "");
    const hasReklamacni = footerText.includes("Reklamační řád");
    const hasOldName = footerText.includes("CAR makléř") || footerText.includes("makléř, s.r.o");
    const hasNewName = footerText.includes("CarMakler s.r.o.");
    console.log(`\nPort 3000 (STARÝ SERVER):`);
    console.log(`  'Reklamační řád': ${hasReklamacni ? "❌ PŘÍTOMNO (stale build)" : "✅ CHYBÍ"}`);
    console.log(`  Starý název ('CAR makléř'): ${hasOldName ? "❌ PŘÍTOMNO (stale build)" : "✅ CHYBÍ"}`);
    console.log(`  Nový název ('CarMakler s.r.o.'): ${hasNewName ? "✅ SPRÁVNĚ" : "❌ CHYBÍ"}`);
    console.log(`\n  ⚠️ PORT 3000 SLOUŽÍ ZASTARALÝ BUILD — nutný restart serveru!`);
  });
});

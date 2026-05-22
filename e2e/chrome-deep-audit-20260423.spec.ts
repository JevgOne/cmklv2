import { test, expect, Page } from "@playwright/test";

// Deep Comprehensive Audit — carmakler.cz (via localhost:3000)
// Date: 2026-04-23
// Coverage: 26 main pages + 6 eshop/inzerce + navigation + flows + content quality + SEO

const BASE = "http://localhost:3000";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function auditPage(page: Page, path: string) {
  const url = `${BASE}${path}`;
  let status = 0;
  try {
    const resp = await page.goto(url, { timeout: 20000 });
    status = resp?.status() ?? 0;
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(800);
  } catch (e) {
    console.log(`ERROR loading ${path}:`, e);
    return { status: 0, h1: null, title: null, h2s: [], issues: [`TIMEOUT/ERROR: ${e}`] };
  }

  const title = await page.title().catch(() => "");
  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  const h2s = await page.locator("h2").allTextContents().catch(() => []);

  // Check for placeholder/debug texts
  const bodyText = await page.locator("body").textContent().catch(() => "");
  const issues: string[] = [];

  const placeholders = [
    "lorem ipsum", "placeholder", "TODO", "FIXME", "undefined", "null",
    "coming soon", "lorem", "[object Object]", "NaN", "test test",
  ];
  for (const p of placeholders) {
    if (bodyText?.toLowerCase().includes(p.toLowerCase())) {
      issues.push(`PLACEHOLDER: "${p}" nalezen na stránce`);
    }
  }

  // Check for console errors
  const consoleLogs: string[] = [];
  page.on("console", msg => {
    if (msg.type() === "error") consoleLogs.push(msg.text().slice(0, 100));
  });

  // Check for broken images
  const brokenImages = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img")) as HTMLImageElement[];
    return imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src).slice(0, 5);
  });
  if (brokenImages.length > 0) issues.push(`BROKEN IMAGES: ${brokenImages.join(", ")}`);

  // Check meta description
  const metaDesc = await page.locator('meta[name="description"]').getAttribute("content").catch(() => null);

  return { status, h1: h1?.trim(), title, h2s, metaDesc, issues };
}

async function checkNavbar(page: Page) {
  // Desktop navbar key links
  const navLinks = ["/nabidka", "/makleri", "/chci-prodat"];
  const results: Record<string, boolean> = {};
  for (const link of navLinks) {
    const count = await page.locator(`nav a[href="${link}"], header a[href="${link}"]`).count();
    results[link] = count > 0;
  }
  return results;
}

async function checkFooter(page: Page) {
  const footerLinks = ["/o-nas", "/kontakt", "/obchodni-podminky", "/ochrana-osobnich-udaju"];
  const results: Record<string, boolean> = {};
  for (const link of footerLinks) {
    const count = await page.locator(`footer a[href="${link}"]`).count();
    results[link] = count > 0;
  }
  return results;
}

// ── GROUP 1: Core Pages ───────────────────────────────────────────────────────

test.describe("1. Hlavní stránky", () => {

  test("/ — homepage", async ({ page }) => {
    const r = await auditPage(page, "/");
    console.log("\n=== / ===");
    console.log("HTTP:", r.status, "| Title:", r.title);
    console.log("H1:", r.h1);
    console.log("H2s:", r.h2s.slice(0, 6));
    console.log("Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-homepage.png", fullPage: true });
    expect(r.status).toBe(200);
  });

  test("/nabidka — katalog vozidel", async ({ page }) => {
    const r = await auditPage(page, "/nabidka");
    console.log("\n=== /nabidka ===");
    console.log("HTTP:", r.status, "| Title:", r.title);
    console.log("H1:", r.h1);
    console.log("H2s:", r.h2s.slice(0, 6));
    console.log("Issues:", r.issues);

    // Check for vehicle cards
    const cardCount = await page.locator('[data-testid="vehicle-card"], .vehicle-card, article, [class*="card"]').count();
    console.log("Karty vozidel (approx):", cardCount);

    await page.screenshot({ path: "test-results/audit-nabidka.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/chci-prodat — prodej auta", async ({ page }) => {
    const r = await auditPage(page, "/chci-prodat");
    console.log("\n=== /chci-prodat ===");
    console.log("HTTP:", r.status, "| Title:", r.title);
    console.log("H1:", r.h1);
    console.log("H2s:", r.h2s.slice(0, 8));

    // "Nejste si jistí?" section
    const nejsteCount = await page.locator('h2:has-text("Nejste si jistí")').count();
    const pillLinks = await page.locator('.rounded-xl.bg-gray-100, a[class*="rounded-xl"][class*="bg-gray-100"]').count();
    console.log('"Nejste si jistí?" sekce:', nejsteCount, "| Pill linky:", pillLinks);
    console.log("Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-chci-prodat.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/jak-to-funguje", async ({ page }) => {
    const r = await auditPage(page, "/jak-to-funguje");
    console.log("\n=== /jak-to-funguje ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-jak-to-funguje.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/o-nas", async ({ page }) => {
    const r = await auditPage(page, "/o-nas");
    console.log("\n=== /o-nas ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-o-nas.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/kariera", async ({ page }) => {
    const r = await auditPage(page, "/kariera");
    console.log("\n=== /kariera ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-kariera.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/recenze", async ({ page }) => {
    const r = await auditPage(page, "/recenze");
    console.log("\n=== /recenze ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-recenze.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/kontakt", async ({ page }) => {
    const r = await auditPage(page, "/kontakt");
    console.log("\n=== /kontakt ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-kontakt.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/makleri — seznam makléřů", async ({ page }) => {
    const r = await auditPage(page, "/makleri");
    console.log("\n=== /makleri ===");
    console.log("HTTP:", r.status, "| H1:", r.h1);
    const brokerCards = await page.locator('[class*="broker"], [data-testid*="broker"], .makleri-card').count();
    const anyCards = await page.locator('article, [class*="card"]').count();
    console.log("Makléř karty:", brokerCards, "| Any cards:", anyCards);
    console.log("Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-makleri.png", fullPage: false });
    expect(r.status).toBe(200);
  });

});

// ── GROUP 2: Registrace ───────────────────────────────────────────────────────

test.describe("2. Registrace", () => {

  test("/registrace", async ({ page }) => {
    const r = await auditPage(page, "/registrace");
    console.log("\n=== /registrace ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-registrace.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/registrace/makler", async ({ page }) => {
    const r = await auditPage(page, "/registrace/makler");
    console.log("\n=== /registrace/makler ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-registrace-makler.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/registrace/partner", async ({ page }) => {
    const r = await auditPage(page, "/registrace/partner");
    console.log("\n=== /registrace/partner ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-registrace-partner.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/registrace/dodavatel", async ({ page }) => {
    const r = await auditPage(page, "/registrace/dodavatel");
    console.log("\n=== /registrace/dodavatel ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-registrace-dodavatel.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/prihlaseni", async ({ page }) => {
    const r = await auditPage(page, "/prihlaseni");
    console.log("\n=== /prihlaseni ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-prihlaseni.png", fullPage: false });
    expect(r.status).toBe(200);
  });

});

// ── GROUP 3: Služby ───────────────────────────────────────────────────────────

test.describe("3. Služby", () => {

  test("/sluzby/proverka", async ({ page }) => {
    const r = await auditPage(page, "/sluzby/proverka");
    console.log("\n=== /sluzby/proverka ===");
    console.log("HTTP:", r.status, "| H1:", r.h1);
    const dalsiSluzby = await page.locator('h2:has-text("Další služby")').count();
    console.log('"Další služby CarMakléř":', dalsiSluzby, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-proverka.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/sluzby/financovani", async ({ page }) => {
    const r = await auditPage(page, "/sluzby/financovani");
    console.log("\n=== /sluzby/financovani ===");
    console.log("HTTP:", r.status, "| H1:", r.h1);
    const dalsiSluzby = await page.locator('h2:has-text("Další služby")').count();
    console.log('"Další služby CarMakléř":', dalsiSluzby, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-financovani.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/sluzby/pojisteni", async ({ page }) => {
    const r = await auditPage(page, "/sluzby/pojisteni");
    console.log("\n=== /sluzby/pojisteni ===");
    console.log("HTTP:", r.status, "| H1:", r.h1);
    const dalsiSluzby = await page.locator('h2:has-text("Další služby")').count();
    console.log('"Další služby CarMakléř":', dalsiSluzby, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-pojisteni.png", fullPage: false });
    expect(r.status).toBe(200);
  });

});

// ── GROUP 4: SEO Landing Pages ────────────────────────────────────────────────

test.describe("4. SEO Landing Pages", () => {

  test("/jak-prodat-auto", async ({ page }) => {
    const r = await auditPage(page, "/jak-prodat-auto");
    console.log("\n=== /jak-prodat-auto ===");
    console.log("HTTP:", r.status, "| H1:", r.h1);
    const souvisejici = await page.locator('h2:has-text("Související")').count();
    console.log('"Související" sekce:', souvisejici, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-jak-prodat-auto.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/kolik-stoji-moje-auto", async ({ page }) => {
    const r = await auditPage(page, "/kolik-stoji-moje-auto");
    console.log("\n=== /kolik-stoji-moje-auto ===");
    console.log("HTTP:", r.status, "| H1:", r.h1);
    const souvisejici = await page.locator('h2:has-text("Související")').count();
    console.log('"Související" sekce:', souvisejici, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-kolik-stoji.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/nabidka/skoda — brand SEO", async ({ page }) => {
    const r = await auditPage(page, "/nabidka/skoda");
    console.log("\n=== /nabidka/skoda ===");
    console.log("HTTP:", r.status, "| H1:", r.h1);
    const mohlo = await page.locator('h2:has-text("Mohlo by"), h2:has-text("zajímat")').count();
    const dilyLinks = await page.locator('a[href*="/dily"]').count();
    console.log('"Mohlo by vás zajímat":', mohlo, "| /dily linky:", dilyLinks, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-nabidka-skoda.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/nabidka/skoda/octavia — model SEO", async ({ page }) => {
    const r = await auditPage(page, "/nabidka/skoda/octavia");
    console.log("\n=== /nabidka/skoda/octavia ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-nabidka-octavia.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/dily/znacka/skoda — parts brand SEO", async ({ page }) => {
    const r = await auditPage(page, "/dily/znacka/skoda");
    console.log("\n=== /dily/znacka/skoda ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-dily-skoda.png", fullPage: false });
    expect(r.status).toBe(200);
  });

});

// ── GROUP 5: Marketplace ──────────────────────────────────────────────────────

test.describe("5. Marketplace", () => {

  test("/marketplace", async ({ page }) => {
    const r = await auditPage(page, "/marketplace");
    console.log("\n=== /marketplace ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-marketplace.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/marketplace/apply", async ({ page }) => {
    const r = await auditPage(page, "/marketplace/apply");
    console.log("\n=== /marketplace/apply ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-marketplace-apply.png", fullPage: false });
    // May redirect to login — accept 200 or 302
    expect([200, 302, 307, 308]).toContain(r.status);
  });

});

// ── GROUP 6: Legal / Footer pages ─────────────────────────────────────────────

test.describe("6. Legal / Footer", () => {

  test("/prezentace", async ({ page }) => {
    const r = await auditPage(page, "/prezentace");
    console.log("\n=== /prezentace ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-prezentace.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/obchodni-podminky", async ({ page }) => {
    const r = await auditPage(page, "/obchodni-podminky");
    console.log("\n=== /obchodni-podminky ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-obchodni-podminky.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/ochrana-osobnich-udaju", async ({ page }) => {
    const r = await auditPage(page, "/ochrana-osobnich-udaju");
    console.log("\n=== /ochrana-osobnich-udaju ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-ochrana-udaju.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/zasady-cookies", async ({ page }) => {
    const r = await auditPage(page, "/zasady-cookies");
    console.log("\n=== /zasady-cookies ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-zasady-cookies.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/reklamacni-rad", async ({ page }) => {
    const r = await auditPage(page, "/reklamacni-rad");
    console.log("\n=== /reklamacni-rad ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-reklamacni-rad.png", fullPage: false });
    expect(r.status).toBe(200);
  });

});

// ── GROUP 7: E-shop / Díly ────────────────────────────────────────────────────

test.describe("7. E-shop / Díly", () => {

  test("/dily — eshop homepage", async ({ page }) => {
    const r = await auditPage(page, "/dily");
    console.log("\n=== /dily ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-dily.png", fullPage: false });
    expect(r.status).toBe(200);
  });

  test("/dily/katalog — katalog dílů", async ({ page }) => {
    const r = await auditPage(page, "/dily/katalog");
    console.log("\n=== /dily/katalog ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    // Check for spinner (bug: infinite spinner)
    const spinners = await page.locator('[class*="spinner"], [class*="loading"], [class*="animate-spin"]').count();
    console.log("Spinnery:", spinners);
    await page.screenshot({ path: "test-results/audit-dily-katalog.png", fullPage: false });
    expect([200, 302, 307, 308]).toContain(r.status);
  });

  test("/dily/kosik — košík", async ({ page }) => {
    const r = await auditPage(page, "/dily/kosik");
    console.log("\n=== /dily/kosik ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-dily-kosik.png", fullPage: false });
    expect([200, 302, 307, 308]).toContain(r.status);
  });

});

// ── GROUP 8: Inzerce ──────────────────────────────────────────────────────────

test.describe("8. Inzerce", () => {

  test("/inzerce — inzerce homepage", async ({ page }) => {
    const r = await auditPage(page, "/inzerce");
    console.log("\n=== /inzerce ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-inzerce.png", fullPage: false });
    expect([200, 302, 307, 308]).toContain(r.status);
  });

  test("/inzerce/katalog → redirect /nabidka", async ({ page }) => {
    const redirects: string[] = [];
    page.on("response", resp => {
      if ([301, 302, 307, 308].includes(resp.status())) {
        redirects.push(`${resp.status()} → ${resp.headers()["location"]}`);
      }
    });
    const resp = await page.goto(`${BASE}/inzerce/katalog`, { timeout: 15000 });
    await page.waitForLoadState("domcontentloaded");
    const finalUrl = page.url();
    const spinners = await page.locator('[class*="spinner"], [class*="animate-spin"]').count();
    console.log("\n=== /inzerce/katalog ===");
    console.log("Final URL:", finalUrl);
    console.log("Redirects:", redirects);
    console.log("Spinnery:", spinners);
    expect(finalUrl).toContain("/nabidka");
    expect(spinners).toBe(0);
  });

  test("/inzerce/pridat — přidat inzerát", async ({ page }) => {
    const r = await auditPage(page, "/inzerce/pridat");
    console.log("\n=== /inzerce/pridat ===");
    console.log("HTTP:", r.status, "| H1:", r.h1, "| Issues:", r.issues);
    await page.screenshot({ path: "test-results/audit-inzerce-pridat.png", fullPage: false });
    expect([200, 302, 307, 308]).toContain(r.status);
  });

});

// ── GROUP 9: Navigation Audit ─────────────────────────────────────────────────

test.describe("9. Navigace", () => {

  test("Desktop navbar — klíčové linky", async ({ page }) => {
    await page.goto(`${BASE}/`, { timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");

    const navLinks = await page.locator("nav a, header a").evaluateAll(
      (els: HTMLAnchorElement[]) => els
        .map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 40), href: el.getAttribute("href") }))
        .filter(l => l.text.length > 0 && l.href)
    );
    console.log("\n=== Navbar linky ===");
    navLinks.forEach(l => console.log(`  ${l.href} — "${l.text}"`));

    const hasNabidka = navLinks.some(l => l.href?.includes("/nabidka"));
    const hasMakleri = navLinks.some(l => l.href?.includes("/makleri"));
    const hasChciProdat = navLinks.some(l => l.href?.includes("/chci-prodat") || l.href?.includes("/chci_prodat"));

    console.log("Nabídka v nav:", hasNabidka, "| Makléři v nav:", hasMakleri, "| Chci prodat v nav:", hasChciProdat);
    await page.screenshot({ path: "test-results/audit-navbar.png" });

    expect(hasNabidka || hasMakleri).toBe(true);
  });

  test("Footer — klíčové linky", async ({ page }) => {
    await page.goto(`${BASE}/`, { timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const footerLinks = await page.locator("footer a").evaluateAll(
      (els: HTMLAnchorElement[]) => els
        .map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 40), href: el.getAttribute("href") }))
        .filter(l => l.text.length > 0 && l.href)
    );
    console.log("\n=== Footer linky ===");
    footerLinks.forEach(l => console.log(`  ${l.href} — "${l.text}"`));

    const hasONas = footerLinks.some(l => l.href?.includes("/o-nas"));
    const hasKontakt = footerLinks.some(l => l.href?.includes("/kontakt"));
    const hasOP = footerLinks.some(l => l.href?.includes("/obchodni-podminky") || l.href?.includes("/ochrana"));
    console.log("O nás:", hasONas, "| Kontakt:", hasKontakt, "| Legal:", hasOP);
    await page.screenshot({ path: "test-results/audit-footer.png" });
  });

  test("Mobile hamburger menu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
    await page.goto(`${BASE}/`, { timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");

    // Try to find and click hamburger
    const hamburger = page.locator('[aria-label*="menu"], [aria-label*="Menu"], button:has(svg), .hamburger, [class*="hamburger"], [class*="mobile-menu"] button').first();
    const hamburgerVisible = await hamburger.isVisible().catch(() => false);
    console.log("\n=== Mobile hamburger ===");
    console.log("Hamburger viditelný:", hamburgerVisible);

    if (hamburgerVisible) {
      await hamburger.click();
      await page.waitForTimeout(500);
      const menuLinks = await page.locator('[role="menu"] a, [class*="mobile"] a, [class*="drawer"] a, nav a:visible').count();
      console.log("Linky v mobile menu:", menuLinks);
      await page.screenshot({ path: "test-results/audit-mobile-menu.png" });
    } else {
      await page.screenshot({ path: "test-results/audit-mobile-menu.png" });
      console.log("Hamburger nenalezen nebo skrytý");
    }
  });

});

// ── GROUP 10: Flow Tests ──────────────────────────────────────────────────────

test.describe("10. Uživatelské toky", () => {

  test("Flow: vyhledávání vozidla (/ → /nabidka → detail)", async ({ page }) => {
    // Homepage
    await page.goto(`${BASE}/`, { timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");

    // Navigate to /nabidka
    const nabidkaLink = page.locator('a[href="/nabidka"], a[href*="nabidka"]').first();
    if (await nabidkaLink.isVisible()) {
      await nabidkaLink.click();
      await page.waitForLoadState("domcontentloaded");
    } else {
      await page.goto(`${BASE}/nabidka`, { timeout: 15000 });
    }

    const nabidkaStatus = page.url().includes("nabidka");
    console.log("\n=== Flow: Homepage → Nabídka ===");
    console.log("Dostal jsem se na /nabidka:", nabidkaStatus);

    // Click first vehicle
    const firstCard = page.locator('article a, .car-card a, [class*="card"] a[href*="/nabidka/"]').first();
    const firstCardVisible = await firstCard.isVisible().catch(() => false);
    if (firstCardVisible) {
      const href = await firstCard.getAttribute("href");
      console.log("První vozidlo href:", href);
      await firstCard.click();
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);
      const finalUrl = page.url();
      console.log("Po kliknutí URL:", finalUrl);
      await page.screenshot({ path: "test-results/audit-flow-vozidlo-detail.png", fullPage: false });
    }

    expect(nabidkaStatus).toBe(true);
  });

  test("Flow: Chci prodat — formulář dostupný", async ({ page }) => {
    await page.goto(`${BASE}/chci-prodat`, { timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);

    const forms = await page.locator("form").count();
    const inputs = await page.locator("input, textarea, select").count();
    const submitBtn = await page.locator('[type="submit"], button:has-text("Odeslat"), button:has-text("Prodat")').count();

    console.log("\n=== Flow: Chci prodat — formulář ===");
    console.log("Forms:", forms, "| Inputs:", inputs, "| Submit:", submitBtn);
    await page.screenshot({ path: "test-results/audit-flow-chci-prodat.png", fullPage: false });
    expect(forms + inputs).toBeGreaterThan(0);
  });

  test("Flow: E-shop díly — prohledání katalogu", async ({ page }) => {
    await page.goto(`${BASE}/dily`, { timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    const h1 = await page.locator("h1").first().textContent().catch(() => null);
    const items = await page.locator('[class*="part"], [class*="dil"], [class*="product"], article').count();
    const searchInput = await page.locator('input[type="search"], input[placeholder*="Hledej"], input[placeholder*="VIN"]').count();

    console.log("\n=== Flow: E-shop díly ===");
    console.log("H1:", h1?.trim(), "| Items:", items, "| Search input:", searchInput);
    await page.screenshot({ path: "test-results/audit-flow-eshop.png", fullPage: false });
    // Just check it loads
    const status = await page.goto(`${BASE}/dily`, { timeout: 15000 }).then(r => r?.status());
    expect(status).toBe(200);
  });

});

// ── GROUP 11: SEO Meta Checks ─────────────────────────────────────────────────

test.describe("11. SEO — meta tagy", () => {

  const seoPages = [
    { path: "/", label: "homepage" },
    { path: "/nabidka", label: "nabidka" },
    { path: "/chci-prodat", label: "chci-prodat" },
    { path: "/makleri", label: "makleri" },
    { path: "/jak-prodat-auto", label: "jak-prodat-auto" },
    { path: "/kolik-stoji-moje-auto", label: "kolik-stoji-moje-auto" },
  ];

  for (const p of seoPages) {
    test(`SEO: ${p.path}`, async ({ page }) => {
      await page.goto(`${BASE}${p.path}`, { timeout: 20000 });
      await page.waitForLoadState("domcontentloaded");

      const title = await page.title();
      const metaDesc = await page.locator('meta[name="description"]').getAttribute("content").catch(() => null);
      const h1 = await page.locator("h1").first().textContent().catch(() => null);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href").catch(() => null);
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content").catch(() => null);

      console.log(`\n=== SEO: ${p.path} ===`);
      console.log("Title:", title?.slice(0, 80));
      console.log("Meta desc:", metaDesc?.slice(0, 120));
      console.log("H1:", h1?.trim());
      console.log("Canonical:", canonical);
      console.log("OG title:", ogTitle);

      const issues: string[] = [];
      if (!title || title.length < 10) issues.push("Chybí nebo krátký title");
      if (!metaDesc) issues.push("Chybí meta description");
      if (!h1) issues.push("Chybí H1");
      console.log("SEO issues:", issues);
    });
  }

});

// ── GROUP 12: Content Quality ─────────────────────────────────────────────────

test.describe("12. Kvalita obsahu", () => {

  test("Homepage — kontrola obsahu a layoutu", async ({ page }) => {
    await page.goto(`${BASE}/`, { timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);

    // Check for "Carmakler" branding
    const bodyText = await page.locator("body").textContent().catch(() => "");
    const hasBranding = bodyText?.toLowerCase().includes("carmakléř") || bodyText?.toLowerCase().includes("carmakler");

    // Check hero section
    const heroH1 = await page.locator("h1").first().textContent().catch(() => null);

    // Check CTA buttons
    const ctaButtons = await page.locator('a[class*="btn"], button[class*="btn"], a.rounded-full, a[class*="orange"]').count();

    // Check for obvious UI issues (empty sections)
    const emptySections = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll("section"));
      return sections.filter(s => (s.textContent?.trim().length ?? 0) < 10).length;
    });

    console.log("\n=== Homepage kvalita obsahu ===");
    console.log("Branding (Carmakléř/Carmakler):", hasBranding);
    console.log("Hero H1:", heroH1?.trim());
    console.log("CTA buttons:", ctaButtons);
    console.log("Prázdné sekce:", emptySections);

    await page.screenshot({ path: "test-results/audit-content-homepage.png", fullPage: false });
    expect(hasBranding).toBe(true);
  });

  test("/nabidka — karty vozidel zobrazeny, žádný spinner", async ({ page }) => {
    await page.goto(`${BASE}/nabidka`, { timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const spinners = await page.locator('[class*="spinner"], [class*="animate-spin"]').count();
    const skeletons = await page.locator('[class*="skeleton"], [class*="loading"]').count();

    // Try to find vehicle cards
    const cards = await page.evaluate(() => {
      const articles = document.querySelectorAll("article");
      const divCards = document.querySelectorAll('[class*="card"]');
      return { articles: articles.length, cards: divCards.length };
    });

    console.log("\n=== /nabidka — karty a spinner ===");
    console.log("Spinnery:", spinners, "| Skeletony:", skeletons);
    console.log("Articles:", cards.articles, "| Cards:", cards.cards);

    await page.screenshot({ path: "test-results/audit-content-nabidka.png", fullPage: false });
    expect(spinners).toBe(0);
  });

  test("Profil makléře — jan-novak-praha", async ({ page }) => {
    const resp = await page.goto(`${BASE}/profil/jan-novak-praha`, { timeout: 20000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    const status = resp?.status() ?? 0;
    const h1 = await page.locator("h1").first().textContent().catch(() => null);

    // Check contact CTA
    const ctaChciProdat = await page.locator('a[href="/chci-prodat"]').count();
    const bgOrange = await page.locator('[class*="bg-orange"]').count();

    console.log("\n=== /profil/jan-novak-praha ===");
    console.log("HTTP:", status, "| H1:", h1?.trim());
    console.log("CTA /chci-prodat linky:", ctaChciProdat, "| Orange elements:", bgOrange);

    await page.screenshot({ path: "test-results/audit-profil-makler.png", fullPage: false });
    expect(status).toBe(200);
  });

});

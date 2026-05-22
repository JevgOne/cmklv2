import { test, expect } from "@playwright/test";

// Task #28 — Cross-linking + inzerce katalog
// 2026-04-20

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function logLinks(page: any, label: string) {
  const links = await page.locator("a[href]").evaluateAll((els: HTMLAnchorElement[]) =>
    els.map((el) => ({ text: el.innerText.trim().slice(0, 60), href: el.getAttribute("href") }))
       .filter((l) => l.href && !l.href.startsWith("#") && l.text.length > 0)
  );
  console.log(`[${label}] Links (${links.length}):`, JSON.stringify(links.slice(0, 30), null, 2));
}

// ─── SERVICE PAGES CROSS-LINKING ──────────────────────────────────────────────

test.describe("Cross-linking — /sluzby/financovani", () => {
  test("Obsahuje cross-linky na ostatní služby", async ({ page }) => {
    await page.goto("/sluzby/financovani");
    await page.waitForLoadState("networkidle");

    // Log all headings
    const h2s = await page.locator("h2").allTextContents();
    const h3s = await page.locator("h3").allTextContents();
    console.log("H2:", h2s);
    console.log("H3:", h3s);

    await logLinks(page, "financovani");

    // Check for cross-links to other service pages
    const proverkaLink = await page.locator('a[href*="proverka"]').count();
    const pojisteniLink = await page.locator('a[href*="pojisteni"]').count();
    console.log("Link na proverka:", proverkaLink);
    console.log("Link na pojisteni:", pojisteniLink);

    // Check for any "cross-linking" section (cards below FAQ)
    const crossSection = await page.locator('[class*="grid"], [class*="cards"], section').count();
    console.log("Grid/cards/sections:", crossSection);

    // Screenshot — full page
    await page.screenshot({ path: "test-results/crosslink-financovani.png", fullPage: true });

    expect(proverkaLink + pojisteniLink).toBeGreaterThan(0);
  });
});

test.describe("Cross-linking — /sluzby/proverka", () => {
  test("Obsahuje cross-linky na ostatní služby", async ({ page }) => {
    await page.goto("/sluzby/proverka");
    await page.waitForLoadState("networkidle");

    const h2s = await page.locator("h2").allTextContents();
    console.log("H2:", h2s);

    await logLinks(page, "proverka");

    const financovaniLink = await page.locator('a[href*="financovani"]').count();
    const pojisteniLink = await page.locator('a[href*="pojisteni"]').count();
    console.log("Link na financovani:", financovaniLink);
    console.log("Link na pojisteni:", pojisteniLink);

    await page.screenshot({ path: "test-results/crosslink-proverka.png", fullPage: true });

    expect(financovaniLink + pojisteniLink).toBeGreaterThan(0);
  });
});

test.describe("Cross-linking — /sluzby/pojisteni", () => {
  test("Obsahuje cross-linky na ostatní služby", async ({ page }) => {
    await page.goto("/sluzby/pojisteni");
    await page.waitForLoadState("networkidle");

    const h2s = await page.locator("h2").allTextContents();
    console.log("H2:", h2s);

    await logLinks(page, "pojisteni");

    const financovaniLink = await page.locator('a[href*="financovani"]').count();
    const proverkaLink = await page.locator('a[href*="proverka"]').count();
    console.log("Link na financovani:", financovaniLink);
    console.log("Link na proverka:", proverkaLink);

    await page.screenshot({ path: "test-results/crosslink-pojisteni.png", fullPage: true });

    expect(financovaniLink + proverkaLink).toBeGreaterThan(0);
  });
});

// ─── NABIDKA DETAIL — Doplňkové služby ────────────────────────────────────────

test.describe("Cross-linking — /nabidka/[slug] detail vozu", () => {
  test("Sekce Doplňkové služby existuje a má linky na služby", async ({ page }) => {
    await page.goto("/nabidka/peugeot-3008-gt-2022");
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    console.log("H1:", h1?.trim());

    const h2s = await page.locator("h2").allTextContents();
    const h3s = await page.locator("h3").allTextContents();
    console.log("H2:", h2s);
    console.log("H3:", h3s);

    await logLinks(page, "nabidka-detail");

    // Look for "Doplňkové služby" section
    const doplnkoveHeading = await page.locator('h2:has-text("Doplňkové"), h2:has-text("doplnk"), h3:has-text("Doplňkové"), h2:has-text("služby"), [class*="doplnk"]').count();
    console.log("'Doplňkové služby' heading count:", doplnkoveHeading);

    // Check for service links on detail page
    const serviceLinks = await page.locator('a[href*="/sluzby/"]').count();
    const financovaniLink = await page.locator('a[href*="financovani"]').count();
    const proverkaLink = await page.locator('a[href*="proverka"]').count();
    const pojisteniLink = await page.locator('a[href*="pojisteni"]').count();
    console.log("Service links total:", serviceLinks);
    console.log("  /sluzby/financovani:", financovaniLink);
    console.log("  /sluzby/proverka:", proverkaLink);
    console.log("  /sluzby/pojisteni:", pojisteniLink);

    await page.screenshot({ path: "test-results/crosslink-nabidka-detail.png", fullPage: true });

    expect(serviceLinks).toBeGreaterThan(0);
  });
});

// ─── /chci-prodat — "Nejste si jistí?" sekce ──────────────────────────────────

test.describe("Cross-linking — /chci-prodat", () => {
  test("Sekce 'Nejste si jistí?' nebo soft CTA linky existují", async ({ page }) => {
    await page.goto("/chci-prodat");
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    console.log("H1:", h1?.trim());

    const h2s = await page.locator("h2").allTextContents();
    const h3s = await page.locator("h3").allTextContents();
    console.log("H2:", h2s);
    console.log("H3:", h3s);

    await logLinks(page, "chci-prodat");

    // "Nejste si jistí?" heading
    const nejsteJisti = await page.locator(
      'h2:has-text("Nejste"), h3:has-text("Nejste"), h2:has-text("jistí"), p:has-text("Nejste si jistí")'
    ).count();
    console.log("'Nejste si jistí?' element count:", nejsteJisti);

    // Check for service/related links
    const serviceLinks = await page.locator('a[href*="/sluzby/"]').count();
    const jaktoFunguje = await page.locator('a[href*="jak-to-funguje"], a[href*="jak-prodat"]').count();
    console.log("Service links:", serviceLinks, "Jak-to-funguje/jak-prodat links:", jaktoFunguje);

    await page.screenshot({ path: "test-results/crosslink-chci-prodat.png", fullPage: true });
  });
});

// ─── /profil/[slug] — CTA "Chcete prodat auto?" ───────────────────────────────

test.describe("Cross-linking — /profil/[slug] profil makléře", () => {
  test("CTA 'Chcete prodat auto?' nebo similar existuje", async ({ page }) => {
    await page.goto("/profil/jan-novak-praha");
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    console.log("H1:", h1?.trim());

    const h2s = await page.locator("h2").allTextContents();
    const h3s = await page.locator("h3").allTextContents();
    console.log("H2:", h2s);
    console.log("H3:", h3s);

    await logLinks(page, "profil-makler");

    // Look for "Chcete prodat auto?" or similar CTA
    const ctaHeading = await page.locator(
      'h2:has-text("Chcete prodat"), h3:has-text("Chcete prodat"), p:has-text("Chcete prodat"), [class*="cta"]'
    ).count();
    console.log("'Chcete prodat auto?' CTA count:", ctaHeading);

    // Check for contact/poptavka links
    const chciProdat = await page.locator('a[href*="chci-prodat"], a[href*="poptavka"], a[href*="kontakt"]').count();
    console.log("Chci-prodat/poptavka/kontakt links:", chciProdat);

    await page.screenshot({ path: "test-results/crosslink-profil-makler.png", fullPage: true });
  });
});

// ─── INZERCE KATALOG — no infinite spinner ────────────────────────────────────

test.describe("Inzerce katalog — žádný nekonečný spinner", () => {
  test("Stránka se načte bez spinneru, jsou vidět inzeráty", async ({ page }) => {
    await page.goto("/inzerce/katalog");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // extra wait to ensure no spinner

    const h1 = await page.locator("h1").first().textContent();
    console.log("H1:", h1?.trim());

    // Check for spinner — should NOT be present
    const spinner = await page.locator(
      '[class*="spinner"], [class*="loading"], [class*="skeleton"], [role="progressbar"], svg[class*="animate-spin"]'
    ).count();
    console.log("Spinner/loading elements:", spinner);

    // Check for content — inzeráty, karty, seznam
    const cards = await page.locator('[class*="card"], article, [class*="inzerat"], [class*="vehicle"]').count();
    const links = await page.locator('a[href*="/inzerce/"]').count();
    console.log("Cards/articles:", cards, "Inzerce links:", links);

    const h2s = await page.locator("h2").allTextContents();
    const h3s = await page.locator("h3").allTextContents();
    console.log("H2:", h2s);

    await page.screenshot({ path: "test-results/inzerce-katalog.png", fullPage: true });

    // No persistent spinner after load
    expect(spinner).toBe(0);
  });

  test("HTTP 200 a základní render", async ({ page }) => {
    const response = await page.goto("/inzerce/katalog");
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

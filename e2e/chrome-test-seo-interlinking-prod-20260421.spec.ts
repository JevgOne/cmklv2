import { test, expect } from "@playwright/test";

// Task #33 — SEO Interlinking audit na PRODUKCI (carmakler.cz)
// 2026-04-21

const BASE = "https://carmakler.cz";

// Helper: log all links in a section by heading text
async function logSectionLinks(page: any, headingText: string) {
  const links = await page.evaluate((heading: string) => {
    const allH2 = Array.from(document.querySelectorAll("h2, h3, h4"));
    const h = allH2.find((el) => el.textContent?.includes(heading));
    if (!h) return { found: false, links: [] };
    const container = h.closest("section") || h.parentElement?.parentElement || h.parentElement;
    if (!container) return { found: true, links: [] };
    const anchors = Array.from(container.querySelectorAll("a[href]")) as HTMLAnchorElement[];
    return {
      found: true,
      links: anchors.map((a) => ({ text: a.innerText.trim().replace(/\s+/g, " ").slice(0, 80), href: a.getAttribute("href") })),
    };
  }, headingText);
  return links;
}

// ─── 1. /nabidka/skoda ────────────────────────────────────────────────────────

test.describe("carmakler.cz/nabidka/skoda — brand landing", () => {
  test("Stránka se načte + H1", async ({ page }) => {
    const resp = await page.goto(`${BASE}/nabidka/skoda`);
    console.log("HTTP:", resp?.status());
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    const h2s = await page.locator("h2").allTextContents();
    const h3s = await page.locator("h3").allTextContents();
    console.log("H1:", h1?.trim());
    console.log("H2s:", h2s);
    console.log("H3s:", h3s.slice(0, 10));

    await page.screenshot({ path: "test-results/prod-nabidka-skoda.png", fullPage: true });
    expect(resp?.status()).toBe(200);
  });

  test('"Mohlo by vás zajímat" nebo cross-link sekce', async ({ page }) => {
    await page.goto(`${BASE}/nabidka/skoda`);
    await page.waitForLoadState("networkidle");

    // Check for "Mohlo by vás zajímat" or similar cross-link sections
    const zajimaSekce = await page.locator(
      'h2:has-text("Mohlo by vás zajímat"), h2:has-text("Zajímat"), h2:has-text("Podobné"), h2:has-text("Doplňkové"), h2:has-text("Další"), h2:has-text("Doporučujeme"), h3:has-text("Mohlo by")'
    ).count();
    console.log('"Mohlo by vás zajímat" / cross-link sekce:', zajimaSekce);

    // Log all H2 to find cross-link section names
    const allH2 = await page.locator("h2").allTextContents();
    console.log("Všechna H2:", allH2);

    // Links to /dily (parts for Skoda)
    const dilyLinks = await page.locator('a[href*="/dily"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
    );
    console.log("Linky na /dily:", JSON.stringify(dilyLinks.slice(0, 8)));

    // Links to /sluzby (services)
    const sluzbyLinks = await page.locator('a[href*="/sluzby"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
    );
    console.log("Linky na /sluzby:", JSON.stringify(sluzbyLinks.slice(0, 8)));

    await page.screenshot({ path: "test-results/prod-nabidka-skoda-crosslinks.png", fullPage: false });

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/prod-nabidka-skoda-bottom.png" });
  });
});

// ─── 2. /nabidka/skoda/octavia ────────────────────────────────────────────────

test.describe("carmakler.cz/nabidka/skoda/octavia — model landing", () => {
  test("Bridge link na díly Octavia", async ({ page }) => {
    const resp = await page.goto(`${BASE}/nabidka/skoda/octavia`);
    console.log("HTTP:", resp?.status());
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    const h2s = await page.locator("h2").allTextContents();
    console.log("H1:", h1?.trim());
    console.log("H2s:", h2s);

    // Bridge link na /dily/znacka/skoda nebo /dily/skoda/octavia
    const dilyBridge = await page.locator('a[href*="dily"][href*="skoda"], a[href*="dily"][href*="octavia"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().slice(0, 60), href: el.getAttribute("href") }))
    );
    console.log("Bridge linky na díly Octavia:", JSON.stringify(dilyBridge));

    // All dily links
    const allDilyLinks = await page.locator('a[href*="/dily"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
    );
    console.log("Všechny /dily linky:", JSON.stringify(allDilyLinks.slice(0, 6)));

    await page.screenshot({ path: "test-results/prod-nabidka-skoda-octavia.png", fullPage: true });
  });
});

// ─── 3. /dily/znacka/skoda ────────────────────────────────────────────────────

test.describe("carmakler.cz/dily/znacka/skoda — parts brand landing", () => {
  test("Bridge link zpět na ojetá Škoda + cross-links", async ({ page }) => {
    const resp = await page.goto(`${BASE}/dily/znacka/skoda`);
    console.log("HTTP:", resp?.status());
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    const h2s = await page.locator("h2").allTextContents();
    console.log("H1:", h1?.trim());
    console.log("H2s:", h2s);

    // Bridge link zpět na ojetá Škoda
    const nabidkaSkoda = await page.locator('a[href*="nabidka"][href*="skoda"], a[href*="nabidka/skoda"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().slice(0, 60), href: el.getAttribute("href") }))
    );
    console.log("Bridge link /nabidka/skoda:", JSON.stringify(nabidkaSkoda));

    // All nabidka links
    const allNabidkaLinks = await page.locator('a[href*="/nabidka"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
    );
    console.log("Všechny /nabidka linky:", JSON.stringify(allNabidkaLinks.slice(0, 8)));

    await page.screenshot({ path: "test-results/prod-dily-skoda.png", fullPage: true });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/prod-dily-skoda-bottom.png" });
  });
});

// ─── 4. /jak-prodat-auto ─────────────────────────────────────────────────────

test.describe("carmakler.cz/jak-prodat-auto — info page", () => {
  test('"Související články" sekce', async ({ page }) => {
    const resp = await page.goto(`${BASE}/jak-prodat-auto`);
    console.log("HTTP:", resp?.status());
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    const h2s = await page.locator("h2").allTextContents();
    console.log("H1:", h1?.trim());
    console.log("H2s:", h2s);

    // "Související články" section
    const souvisejiciSekce = await page.locator(
      'h2:has-text("Související"), h2:has-text("Doporučené"), h2:has-text("Čtěte také"), h3:has-text("Související")'
    ).count();
    console.log('"Související články" sekce:', souvisejiciSekce);

    const sectionLinks = await logSectionLinks(page, "Související");
    console.log("Section links (Související):", JSON.stringify(sectionLinks));

    // All internal links to related pages
    const relatedLinks = await page.locator(
      'a[href*="kolik-stoji"], a[href*="jak-to-funguje"], a[href*="chci-prodat"], a[href*="makleri"]'
    ).evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().slice(0, 60), href: el.getAttribute("href") }))
    );
    console.log("Related internal links:", JSON.stringify(relatedLinks));

    await page.screenshot({ path: "test-results/prod-jak-prodat-auto.png", fullPage: true });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/prod-jak-prodat-bottom.png" });
  });
});

// ─── 5. /kolik-stoji-moje-auto ────────────────────────────────────────────────

test.describe("carmakler.cz/kolik-stoji-moje-auto — valuation page", () => {
  test('"Související články" sekce', async ({ page }) => {
    const resp = await page.goto(`${BASE}/kolik-stoji-moje-auto`);
    console.log("HTTP:", resp?.status());
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    const h2s = await page.locator("h2").allTextContents();
    console.log("H1:", h1?.trim());
    console.log("H2s:", h2s);

    // "Související články" section
    const souvisejiciSekce = await page.locator(
      'h2:has-text("Související"), h2:has-text("Doporučené"), h2:has-text("Čtěte také"), h3:has-text("Související")'
    ).count();
    console.log('"Související články" sekce:', souvisejiciSekce);

    const sectionLinks = await logSectionLinks(page, "Související");
    console.log("Section links (Související):", JSON.stringify(sectionLinks));

    // Related links
    const relatedLinks = await page.locator(
      'a[href*="jak-prodat"], a[href*="jak-to-funguje"], a[href*="chci-prodat"], a[href*="makleri"]'
    ).evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().slice(0, 60), href: el.getAttribute("href") }))
    );
    console.log("Related internal links:", JSON.stringify(relatedLinks));

    await page.screenshot({ path: "test-results/prod-kolik-stoji.png", fullPage: true });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/prod-kolik-stoji-bottom.png" });
  });
});

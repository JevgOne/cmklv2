import { test, expect } from "@playwright/test";

// Task #33 — Production SEO interlinking via direct IP (DNS misconfigured)
// carmakler.cz DNS → 46.28.106.235 (Apache, wrong server)
// Actual prod Next.js server → 91.98.203.239 (HTTPS, correct)
// Using direct IP + Host: carmakler.cz header to bypass DNS
// 2026-04-21

const PROD_BASE = "https://91.98.203.239";
const HOST = "carmakler.cz";

test.use({
  ignoreHTTPSErrors: true,
  extraHTTPHeaders: { Host: HOST },
});

// ─── 1. /nabidka/skoda ────────────────────────────────────────────────────────

test.describe("PROD /nabidka/skoda — brand landing", () => {
  test("HTTP 200 + H1 + title", async ({ page }) => {
    const resp = await page.goto(`${PROD_BASE}/nabidka/skoda`);
    await page.waitForLoadState("networkidle");

    const h1 = await page.locator("h1").first().textContent();
    const h2s = await page.locator("h2").allTextContents();
    const title = await page.title();
    console.log("HTTP:", resp?.status());
    console.log("Title:", title);
    console.log("H1:", h1?.trim());
    console.log("H2s:", h2s);

    await page.screenshot({ path: "test-results/prod-skoda-top.png" });
    expect(resp?.status()).toBe(200);
  });

  test('"Mohlo by vás zajímat" + bridge linky na díly + sluzby', async ({ page }) => {
    await page.goto(`${PROD_BASE}/nabidka/skoda`);
    await page.waitForLoadState("networkidle");

    const allH2 = await page.locator("h2").allTextContents();
    console.log("H2s:", allH2);

    // "Mohlo by vás zajímat" sekce
    const zajimaSekce = await page.locator('h2:has-text("Mohlo by"), h2:has-text("zajímat"), h2:has-text("Doplňkové")').count();
    console.log('"Mohlo by vás zajímat":', zajimaSekce);

    // Linky na /dily
    const dilyLinks = await page.locator('a[href*="/dily"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
    );
    console.log("Dily linky:", JSON.stringify(dilyLinks.slice(0, 6)));

    // Linky na /sluzby
    const sluzbyLinks = await page.locator('a[href*="/sluzby"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
    );
    console.log("Sluzby linky:", JSON.stringify(sluzbyLinks.slice(0, 6)));

    // Model linky
    const modelLinks = await page.locator('a[href*="/nabidka/skoda/"]').evaluateAll(
      (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 50), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
    );
    console.log("Model linky:", JSON.stringify(modelLinks.slice(0, 6)));

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/prod-skoda-bottom.png" });

    expect(zajimaSekce).toBeGreaterThan(0);
  });
});

// ─── 2. /nabidka/skoda/octavia ────────────────────────────────────────────────

test("PROD /nabidka/skoda/octavia — bridge na díly Octavia", async ({ page }) => {
  const resp = await page.goto(`${PROD_BASE}/nabidka/skoda/octavia`);
  await page.waitForLoadState("networkidle");

  const h1 = await page.locator("h1").first().textContent();
  const h2s = await page.locator("h2").allTextContents();
  console.log("H1:", h1?.trim(), "| H2s:", h2s.slice(0, 6));

  const dilyBridge = await page.locator('a[href*="dily"]').evaluateAll(
    (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
  );
  console.log("Bridge na díly:", JSON.stringify(dilyBridge.slice(0, 5)));

  const sluzbyLinks = await page.locator('a[href*="/sluzby"]').evaluateAll(
    (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
  );
  console.log("Sluzby:", JSON.stringify(sluzbyLinks.slice(0, 4)));

  await page.screenshot({ path: "test-results/prod-octavia.png", fullPage: true });
  expect(resp?.status()).toBe(200);
});

// ─── 3. /dily/znacka/skoda ────────────────────────────────────────────────────

test("PROD /dily/znacka/skoda — bridge zpět na ojetá Škoda", async ({ page }) => {
  const resp = await page.goto(`${PROD_BASE}/dily/znacka/skoda`);
  await page.waitForLoadState("networkidle");

  const h1 = await page.locator("h1").first().textContent();
  const h2s = await page.locator("h2").allTextContents();
  console.log("H1:", h1?.trim());
  console.log("H2s:", h2s.slice(0, 8));

  const nabidkaLinks = await page.locator('a[href*="/nabidka"]').evaluateAll(
    (els: HTMLAnchorElement[]) => els.map(el => ({ text: el.innerText.trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href") })).filter(l => l.text.length > 0)
  );
  console.log("Nabidka linky:", JSON.stringify(nabidkaLinks.slice(0, 6)));

  const skodaBridge = nabidkaLinks.find(l => l.href?.includes("skoda"));
  console.log("Bridge /nabidka/skoda:", skodaBridge);

  await page.screenshot({ path: "test-results/prod-dily-skoda.png", fullPage: true });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/prod-dily-skoda-bottom.png" });

  expect(resp?.status()).toBe(200);
  expect(skodaBridge).toBeTruthy();
});

// ─── 4. /jak-prodat-auto ─────────────────────────────────────────────────────

test('PROD /jak-prodat-auto — "Související články" sekce', async ({ page }) => {
  const resp = await page.goto(`${PROD_BASE}/jak-prodat-auto`);
  await page.waitForLoadState("networkidle");

  const h1 = await page.locator("h1").first().textContent();
  const h2s = await page.locator("h2").allTextContents();
  console.log("H1:", h1?.trim());
  console.log("H2s:", h2s);

  const souvisejiSekce = await page.locator('h2:has-text("Související"), h2:has-text("Doporučené"), h3:has-text("Související")').count();
  console.log('"Související" sekce:', souvisejiSekce);

  const sectionLinks = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h2, h3"));
    const related = headings.find(h => h.textContent?.includes("Související") || h.textContent?.includes("Doporučené"));
    if (!related) return { found: false, links: [] };
    const container = related.closest("section") || related.parentElement?.parentElement || related.parentElement;
    return {
      found: true,
      heading: related.textContent?.trim(),
      links: Array.from(container?.querySelectorAll("a[href]") || []).map(a => ({
        text: (a as HTMLAnchorElement).innerText.trim().replace(/\s+/g, " ").slice(0, 60),
        href: (a as HTMLAnchorElement).getAttribute("href")
      }))
    };
  });
  console.log("Section links:", JSON.stringify(sectionLinks));

  await page.screenshot({ path: "test-results/prod-jak-prodat-auto.png", fullPage: true });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/prod-jak-prodat-bottom.png" });

  expect(resp?.status()).toBe(200);
  expect(souvisejiSekce).toBeGreaterThan(0);
});

// ─── 5. /kolik-stoji-moje-auto ────────────────────────────────────────────────

test('PROD /kolik-stoji-moje-auto — "Související články" sekce', async ({ page }) => {
  const resp = await page.goto(`${PROD_BASE}/kolik-stoji-moje-auto`);
  await page.waitForLoadState("networkidle");

  const h1 = await page.locator("h1").first().textContent();
  const h2s = await page.locator("h2").allTextContents();
  console.log("H1:", h1?.trim());
  console.log("H2s:", h2s);

  const souvisejiSekce = await page.locator('h2:has-text("Související"), h2:has-text("Doporučené"), h3:has-text("Související")').count();
  console.log('"Související" sekce:', souvisejiSekce);

  const sectionLinks = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h2, h3"));
    const related = headings.find(h => h.textContent?.includes("Související") || h.textContent?.includes("Doporučené"));
    if (!related) return { found: false, links: [] };
    const container = related.closest("section") || related.parentElement?.parentElement || related.parentElement;
    return {
      found: true,
      heading: related.textContent?.trim(),
      links: Array.from(container?.querySelectorAll("a[href]") || []).map(a => ({
        text: (a as HTMLAnchorElement).innerText.trim().replace(/\s+/g, " ").slice(0, 60),
        href: (a as HTMLAnchorElement).getAttribute("href")
      }))
    };
  });
  console.log("Section links:", JSON.stringify(sectionLinks));

  await page.screenshot({ path: "test-results/prod-kolik-stoji.png", fullPage: true });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: "test-results/prod-kolik-stoji-bottom.png" });

  expect(resp?.status()).toBe(200);
  expect(souvisejiSekce).toBeGreaterThan(0);
});
